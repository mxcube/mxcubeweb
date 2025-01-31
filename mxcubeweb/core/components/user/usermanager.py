import datetime
import json
import logging
import uuid

import flask
import flask_security
import requests

# from authlib.oauth2.rfc6749 import OAuth2Token
from authlib.integrations.flask_client import OAuth
from flask_login import current_user
from mxcubecore import HardwareRepository as HWR
from mxcubecore.model.lims_session import LimsSessionManager

from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.models.usermodels import User
from mxcubeweb.core.util.convertutils import convert_to_dict
from mxcubeweb.core.util.networkutils import (
    is_local_host,
    remote_addr,
)


class BaseUserManager(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)
        HWR.beamline.lims.connect("sessionsChanged", self.handle_sessions_changed)
        self.oauth_client = OAuth(app=app.server.flask)

        self.oauth_client.register(
            name="keycloak",
            client_id=self.app.CONFIG.sso.CLIENT_ID,
            client_secret=self.app.CONFIG.sso.CLIENT_SECRET,
            server_metadata_url=self.app.CONFIG.sso.META_DATA_URI,
            client_kwargs={
                "scope": "openid email profile",
                "code_challenge_method": "S256",  # enable PKCE
            },
        )

    def handle_sessions_changed(self, sessions):
        self.app.server.emit("sessionsChanged", namespace="/hwr")

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
                self.app.server.user_datastore.delete_user(_u)
                self.app.server.user_datastore.commit()

                self.app.server.emit(
                    "userChanged", room=_u.socketio_session_id, namespace="/hwr"
                )

        self.app.server.emit("observersChanged", namespace="/hwr")

    def update_operator(self, new_login=False):
        if not current_user.is_anonymous:
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
                if not HWR.beamline.lims.is_user_login_type():
                    # current_user.nickname = self.app.lims.get_proposal(current_user)
                    current_user.fullname = HWR.beamline.lims.get_full_user_name()
                    current_user.nickname = HWR.beamline.lims.get_user_name()
                else:
                    current_user.nickname = current_user.username

                self.db_set_in_control(current_user, True)

            # Set active proposal to that of the active user
            for _u in User.query.all():
                if _u.is_authenticated and _u.in_control:
                    if not HWR.beamline.lims.is_user_login_type():
                        # In principle there is no need for doing so..
                        self.app.lims.select_session(
                            self.app.lims.get_session_manager().active_session.proposal_name
                        )  # The username is the proposal
                    elif _u.selected_proposal is not None:
                        self.app.lims.select_session(_u.selected_proposal)

    def is_inhouse_user(self, user_id):
        user_id_list = [
            "%s%s" % (code, number)
            for (code, number) in HWR.beamline.session.in_house_users
        ]

        return user_id in user_id_list

    # Abstract method to be implemented by concrete implementation
    def _login(self, login_id, password) -> LimsSessionManager:
        pass

    def sso_validate(self) -> str:
        try:
            token_response = self.oauth_client.keycloak.authorize_access_token()
            username = token_response["userinfo"]["preferred_username"]
            token = token_response["access_token"]
        except Exception as e:
            raise e
        else:
            self.login(username, token, sso_data=token_response)

    def sso_token_expired(self) -> bool:
        res = json.loads(
            requests.post(
                self.app.CONFIG.sso.TOKEN_INFO_URI,
                headers={"Authorization": "Bearer %s" % current_user.token},
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": current_user.refresh_token,
                },
            ).json()
        )

        return "access_token" not in res

    def handle_sso_logout(self):
        if current_user.is_anonymous:
            if self.sso_token_expired():
                self.signout()

    def login(self, login_id: str, password: str, sso_data: dict = {}):
        try:
            self._login(login_id, password)
        except Exception as e:
            self._signout(sso_data=sso_data)
            logging.getLogger("MX3.HWR").error(str(e))
            raise e
        else:
            if "sid" not in flask.session:
                flask.session["sid"] = str(uuid.uuid4())

            # Making sure that the session of any in active users are invalideted
            # before calling login
            self.update_active_users()

            user = self.db_create_user(login_id, password, sso_data)
            self.app.server.user_datastore.activate_user(user)
            flask_security.login_user(user, remember=False)

            # Important to make flask_security user tracking work
            self.app.server.security.datastore.commit()

            address = self.app.sample_changer.get_loaded_sample()

            # If A sample is mounted (and not already marked as such),
            # get sample changer contents and add mounted sample to the queue
            if not self.app.sample_changer.get_current_sample() and address:
                self.app.sample_changer.get_sample_list()

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

        self.app.server.user_datastore.delete_user(user)
        self.app.server.user_datastore.commit()
        flask_security.logout_user()

        self.app.server.emit("observersChanged", namespace="/hwr")

    def is_authenticated(self):
        return current_user.is_authenticated()

    def force_signout_user(self, username):
        user = self.get_user(username)

        if not user.in_control or current_user.is_anonymous:
            socketio_sid = user.socketio_session_id
            HWR.beamline.lims.remove_user(username)
            self.app.server.user_datastore.delete_user(user)
            self.app.server.user_datastore.commit()
            self.app.server.emit("forceSignout", room=socketio_sid, namespace="/hwr")

    def login_info(self):
        # update_operator will update the login status of current_user, and make
        # sure that the is_anonymous has the correct value.
        # Update operator calls lims.select_session that raises an exception if
        # there are no valid LIMS sessions.
        try:
            self.update_operator()
        except Exception:
            pass

        if not current_user.is_anonymous:
            session_manager: LimsSessionManager = self.app.lims.get_session_manager()

            # If no previous session selected and a single session available
            # then it selects automatically the session
            if (
                current_user.selected_proposal is None
                and session_manager.active_session is not None
            ):
                self.app.lims.select_session(session_manager.active_session.session_id)

            login_type = (
                "User" if HWR.beamline.lims.is_user_login_type() else "Proposal"
            )

            res = {
                "synchrotronName": HWR.beamline.session.synchrotron_name,
                "beamlineName": HWR.beamline.session.beamline_name,
                "loggedIn": True,
                "loginType": login_type,
                "limsName": [item.dict() for item in HWR.beamline.lims.get_lims_name()],
                "proposalList": [
                    session.__dict__ for session in session_manager.sessions
                ],
                "rootPath": HWR.beamline.session.get_base_image_directory(),
                "user": current_user.todict(),
                "useSSO": self.app.CONFIG.sso.USE_SSO,
            }

            res["selectedProposal"] = "%s%s" % (
                HWR.beamline.session.proposal_code,
                HWR.beamline.session.proposal_number,
            )
            res["selectedProposalID"] = HWR.beamline.session.proposal_id
        else:
            self._signout()
            logging.getLogger("MX3.HWR").info("Logged out")
            res = {"loggedIn": False, "useSSO": self.app.CONFIG.sso.USE_SSO}

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

    def db_create_user(self, user: str, password: str, sso_data: dict):
        sid = flask.session["sid"]
        user_datastore = self.app.server.user_datastore

        username = HWR.beamline.lims.get_user_name()
        fullname = HWR.beamline.lims.get_full_user_name()
        # if HWR.beamline.lims.loginType.lower() == "user":
        #    username = f"{user}"

        # Make sure that the roles staff and incontrol always
        # exists

        if not user_datastore.find_role("staff"):
            user_datastore.create_role(name="staff")
            user_datastore.create_role(name="incontrol")
            self.app.server.user_datastore.commit()

        _u = user_datastore.find_user(username=username)

        if not _u:
            if not HWR.beamline.lims.is_user_login_type():
                selected_proposal = user
            else:
                selected_proposal = None

            user_datastore.create_user(
                username=username,
                fullname=fullname,
                password="",
                nickname=user,
                session_id=sid,
                selected_proposal=selected_proposal,
                refresh_token=sso_data.get("refresh_token", str(uuid.uuid4())),
                token=sso_data.get("token", str(uuid.uuid4())),
                roles=self._get_configured_roles(user),
            )
        else:
            _u.refresh_token = sso_data.get("refresh_token", str(uuid.uuid4()))
            _u.token = sso_data.get("token", str(uuid.uuid4()))
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

    def _debug(self, msg: str):
        logging.getLogger("HWR").debug(msg)

    def _login(self, login_id: str, password: str) -> LimsSessionManager:
        self._debug("_login. login_id=%s" % login_id)
        try:
            session_manager: LimsSessionManager = HWR.beamline.lims.login(
                login_id, password, is_local_host()
            )
        except Exception as e:
            logging.getLogger("MX3.HWR").error(e)
            raise e

        self._debug(
            "_login. proposal_tuple retrieved. Sessions=%s "
            % str(len(session_manager.sessions))
        )

        inhouse = self.is_inhouse_user(login_id)

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

        # Only allow local login when remote is disabled
        if not self.app.ALLOW_REMOTE and not is_local_host():
            raise Exception("Remote access disabled")

        return session_manager

    def _signout(self, sso_data=None):
        sso_data = sso_data or {}

        if self.app.CONFIG.sso.LOGOUT_URI:
            if not current_user.is_anonymous:
                HWR.beamline.lims.remove_user(current_user.username)
                refresh_token = current_user.refresh_token
            else:
                refresh_token = sso_data.get("refresh_token", None)

            requests.post(
                self.app.CONFIG.sso.LOGOUT_URI,
                data={
                    "client_id": self.app.CONFIG.sso.CLIENT_ID,
                    "client_secret": self.app.CONFIG.sso.CLIENT_SECRET,
                    "refresh_token": refresh_token,
                },
            )


class SSOUserManager(BaseUserManager):
    def __init__(self, app, config):
        super().__init__(app, config)

    def _login(self, login_id: str, password: str, sso: bool):
        return {"status": {"code": "ok", "msg": ""}}

    def _signout(self):
        pass
