import logging
import json
import uuid
import datetime

import flask
import flask_security
from flask_login import current_user

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.models.usermodels import User
from mxcubeweb.core.util.networkutils import is_local_host, remote_addr
from mxcubeweb.core.util.convertutils import convert_to_dict

from mxcubecore import HardwareRepository as HWR


class BaseUserManager(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def get_observers(self):
        return [
            user
            for user in User.query.all()
            if ((not user.in_control) and user.is_authenticated and user.is_active)
        ]

    def get_operator(self):
        user = None

        for _u in User.query.all():
            if _u.in_control:
                user = _u
                break

        return user

    def is_operator(self):
        return getattr(current_user, "in_control", False)

    def active_logged_in_users(self, exclude_inhouse=False):
        self.update_active_users()

        if exclude_inhouse:
            users = [
                _u.username for _u in User.query.all() if _u.active and not _u.isstaff
            ]
        else:
            users = [_u.username for _u in User.query.all() if _u.active]

        return users

    def get_user(self, username):
        user = None

        for _u in User.query.all():
            if _u.username == username:
                user = _u

        return user

    def set_operator(self, username):
        user = None

        for _u in User.query.all():
            if _u.username == username:
                self.db_set_in_control(_u, True)
                user = _u
            else:
                self.db_set_in_control(_u, False)

        return user

    def emit_observers_changed(self, message=""):
        operator = self.app.usermanager.get_operator()

        data = {
            "observers": [_u.todict() for _u in self.app.usermanager.get_observers()],
            "message": message,
            "operator": operator.todict() if operator else {},
        }

        self.app.server.emit("observersChanged", data, namespace="/hwr")

    def update_active_users(self):
        for _u in User.query.all():
            if (
                _u.active
                and _u.last_request_timestamp
                and (datetime.datetime.now() - _u.last_request_timestamp)
                > flask.current_app.permanent_session_lifetime
            ):
                logging.getLogger("HWR.MX3").info(
                    f"Logged out inactive user {_u.username}"
                )
                self.app.server.user_datastore.deactivate_user(_u)

        self.emit_observers_changed()

    def update_operator(self, new_login=False):
        active_in_control = False

        for _u in User.query.all():
            if _u.is_authenticated and _u.in_control:
                active_in_control = True
            else:
                self.db_set_in_control(_u, False)

        # If new login and new observer login, clear nickname
        # so that the user get an opertunity to set one
        if new_login:
            current_user.nickname = ""

        # If no user is currently in control set this user to be
        # in control
        if not active_in_control:
            if HWR.beamline.lims.loginType.lower() != "user":
                current_user.nickname = self.app.lims.get_proposal(current_user)
            else:
                current_user.nickname = current_user.username

            self.db_set_in_control(current_user, True)

        # Set active proposal to that of the active user
        for _u in User.query.all():
            if _u.is_authenticated and _u.in_control:
                if HWR.beamline.lims.loginType.lower() != "user":
                    self.app.lims.select_proposal(self.app.lims.get_proposal(_u))
                elif _u.selected_proposal is not None:
                    self.app.lims.select_proposal(_u.selected_proposal)

    def is_inhouse_user(self, user_id):
        user_id_list = [
            "%s%s" % (code, number)
            for (code, number) in HWR.beamline.session.in_house_users
        ]

        return user_id in user_id_list

    # Abstract method to be implemented by concrete implementation
    def _login(self, login_id, password):
        pass

    def login(self, login_id: str, password: str):
        try:
            login_res = self._login(login_id, password)
        except Exception:
            raise
        else:
            if "sid" not in flask.session:
                flask.session["sid"] = str(uuid.uuid4())

            # Making sure that the session of any in active users are invalideted
            # before calling login
            self.update_active_users()
            user = self.db_create_user(login_id, password, login_res)
            self.app.server.user_datastore.activate_user(user)
            flask_security.login_user(user, remember=False)

            # Important to make flask_security user tracking work
            self.app.server.security.datastore.commit()

            address, barcode = self.app.sample_changer.get_loaded_sample()

            # If A sample is mounted (and not already marked as such),
            # get sample changer contents and add mounted sample to the queue
            if not self.app.sample_changer.get_current_sample() and address:
                self.app.sample_changer.get_sample_list()

            # For the moment not loading queue from persistent storage (redis),
            # uncomment to enable loading.
            # self.app.queue.load_queue(session)
            # logging.getLogger('MX3.HWR').info('Loaded queue')
            logging.getLogger("MX3.HWR").info(
                "[QUEUE] %s " % self.app.queue.queue_to_json()
            )

            self.update_operator(new_login=True)

            msg = "User %s signed in" % user.username
            logging.getLogger("MX3.HWR").info(msg)

    # Abstract method to be implemented by concrete implementation
    def _signout(self):
        pass

    def signout(self):
        self._signout()
        user = current_user

        # If operator logs out clear queue and sample list
        if self.is_operator():
            self.app.queue.save_queue(flask.session)
            self.app.queue.clear_queue()
            HWR.beamline.sample_view.clear_all()
            self.app.lims.init_sample_list()

            self.app.queue.init_queue_settings()

            if hasattr(HWR.beamline.session, "clear_session"):
                HWR.beamline.session.clear_session()

            self.app.CURRENTLY_MOUNTED_SAMPLE = ""

            self.db_set_in_control(current_user, False)

            msg = "User %s signed out" % user.username
            logging.getLogger("MX3.HWR").info(msg)

        self.app.server.user_datastore.deactivate_user(user)
        flask_security.logout_user()

        self.emit_observers_changed()

    def is_authenticated(self):
        return current_user.is_authenticated()

    def force_signout_user(self, username):
        user = self.get_user(username)

        if not user.in_control or current_user.is_anonymous:
            socketio_sid = user.socketio_session_id
            self.app.server.user_datastore.delete_user(user)
            self.app.server.user_datastore.commit()
            self.app.server.emit("forceSignout", room=socketio_sid, namespace="/hwr")

    def login_info(self):
        if not current_user.is_anonymous:
            login_info = convert_to_dict(json.loads(current_user.limsdata))

            self.update_operator()

            proposal_list = [
                {
                    "code": prop["Proposal"]["code"],
                    "number": prop["Proposal"]["number"],
                    "proposalId": prop["Proposal"]["proposalId"],
                    "title": prop["Proposal"]["title"],
                    "person": prop["Person"].get("familyName", ""),
                }
                for prop in login_info.get("proposalList", [])
            ]

            res = {
                "synchrotronName": HWR.beamline.session.synchrotron_name,
                "beamlineName": HWR.beamline.session.beamline_name,
                "loggedIn": True,
                "loginType": HWR.beamline.lims.loginType.title(),
                "proposalList": proposal_list,
                "rootPath": HWR.beamline.session.get_base_image_directory(),
                "user": current_user.todict(),
            }

            res["selectedProposal"] = "%s%s" % (
                HWR.beamline.session.proposal_code,
                HWR.beamline.session.proposal_number,
            )

            res["selectedProposalID"] = HWR.beamline.session.proposal_id
        else:
            raise Exception("Not logged in")

        return res

    def update_user(self, user):
        self.app.server.user_datastore.put(user)
        self.app.server.user_datastore.commit()

    def _get_configured_roles(self, user):
        roles = set()

        _ihs = ["%s%s" % prop for prop in HWR.beamline.session.in_house_users]

        if self.config.inhouse_is_staff and user in _ihs:
            roles.add("staff")

        for _u in self.config.users:
            if _u.username == user:
                roles.add(_u.role)
                break

        return list(roles)

    def db_create_user(self, user: str, password: str, lims_data: dict):
        sid = flask.session["sid"]
        user_datastore = self.app.server.user_datastore
        username = f"{user}-{str(uuid.uuid4())}"
        if HWR.beamline.lims.loginType.lower() == "user":
            username = f"{user}"

        # Make sure that the roles staff and incontrol always
        # exists
        if not user_datastore.find_role("staff"):
            user_datastore.create_role(name="staff")
            user_datastore.create_role(name="incontrol")
            self.app.server.user_datastore.commit()

        _u = user_datastore.find_user(username=username)

        if not _u:
            if HWR.beamline.lims.loginType.lower() != "user":
                selected_proposal = user
            else:
                selected_proposal = None

            user_datastore.create_user(
                username=username,
                password=flask_security.hash_password("password"),
                nickname=user,
                session_id=sid,
                selected_proposal=selected_proposal,
                limsdata=json.dumps(lims_data),
                roles=self._get_configured_roles(user),
            )
        else:
            _u.limsdata = json.dumps(lims_data)
            user_datastore.append_roles(_u, self._get_configured_roles(user))

        self.app.server.user_datastore.commit()

        return user_datastore.find_user(username=username)

    def db_set_in_control(self, user, control):
        user_datastore = self.app.server.user_datastore

        if control:
            for _u in User.query.all():
                if _u.username == user.username:
                    _u.in_control = True
                else:
                    _u.in_control = False

                user_datastore.put(_u)
        else:
            _u = user_datastore.find_user(username=user.username)
            _u.in_control = control
            user_datastore.put(_u)

        self.app.server.user_datastore.commit()


class UserManager(BaseUserManager):
    def __init__(self, app, config):
        super().__init__(app, config)

    def _login(self, login_id: str, password: str):
        login_res = self.app.lims.lims_login(login_id, password, create_session=False)
        inhouse = self.is_inhouse_user(login_id)

        info = {
            "valid": self.app.lims.lims_valid_login(login_res),
            "local": is_local_host(),
            "existing_session": self.app.lims.lims_existing_session(login_res),
            "inhouse": inhouse,
        }

        active_users = self.active_logged_in_users()

        if login_id in active_users:
            if current_user.is_anonymous:
                self.force_signout_user(login_id)
            else:
                if current_user.username == login_id:
                    raise Exception("You are already logged in")
                else:
                    raise Exception(
                        "Login rejected, you are already logged in"
                        " somewhere else\nand Another user is already"
                        " logged in"
                    )

        # Only allow in-house log-in from local host
        if inhouse and not (inhouse and is_local_host()):
            raise Exception("In-house only allowed from localhost")

        non_inhouse_active_users = self.active_logged_in_users(exclude_inhouse=True)

        # Only allow other users to log-in if they are from the same proposal
        # (making sure to exclude inhouse users who are always allowed to login)
        if (
            (not inhouse)
            and non_inhouse_active_users
            and (login_id not in [p.split("-")[0] for p in non_inhouse_active_users])
            and HWR.beamline.lims.loginType.lower() != "user"
        ):
            raise Exception("Another user is already logged in")

        # Only allow if no one else is logged in
        if not current_user.is_anonymous:
            if (
                active_users
                and current_user.username != login_id
                and HWR.beamline.lims.loginType.lower() == "user"
            ):
                raise Exception("Another user is already logged in")

        # Only allow local login when remote is disabled
        if not self.app.ALLOW_REMOTE and not is_local_host():
            raise Exception("Remote access disabled")

        # Only allow remote logins with existing sessions
        if self.app.lims.lims_valid_login(login_res) and is_local_host():
            if not self.app.lims.lims_existing_session(login_res):
                login_res = self.app.lims.create_lims_session(login_res)

            msg = "[LOGIN] Valid login from local host (%s)" % str(info)
            logging.getLogger("MX3.HWR").info(msg)
        elif self.app.lims.lims_valid_login(
            login_res
        ) and self.app.lims.lims_existing_session(login_res):
            msg = "[LOGIN] Valid remote login from %s with existing session (%s)"
            msg += msg % (remote_addr(), str(info))
            logging.getLogger("MX3.HWR").info(msg)
        else:
            logging.getLogger("MX3.HWR").info("Invalid login %s" % info)
            raise Exception(str(info))

        return login_res

    def _signout(self):
        pass
