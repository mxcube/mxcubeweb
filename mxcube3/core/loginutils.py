from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import datetime
import socket
import functools
import logging
import json
import uuid

from collections import deque
from flask import session, request, Response
import flask_socketio

from flask_security import hash_password, current_user, login_user, logout_user

from mxcube3 import mxcube

from mxcube3 import state_storage
from mxcube3 import server
from mxcube3.core.user.models import User, Message, MessagesUsers

from . import limsutils
from . import utils
from . import qutils
from . import scutils


PENDING_EVENTS = deque()
DISCONNECT_HANDLED = True
MESSAGES = []

def remove_user(sid):
    user = mxcube.USERS.pop(sid)

    if user["operator"]:
        state_storage.flush()
        #flush()
    else:
        server.emit("observerLogout", user, namespace="/hwr")
        server.emit("observersChanged", get_observers(), namespace="/hwr")

def get_observers():
    return [user for user in User.query.all() if not user.in_control]

def get_operator():
    user = None

    for _u in User.query.all():
        if _u.in_control:
            user = _u
            break

    return user

def is_operator():
    return current_user.in_control

def logged_in_users(exclude_inhouse=False):
    users = [user["loginID"] for user in mxcube.USERS.values()]

    if exclude_inhouse:
        if isinstance(mxcube.mxcubecore.beamline_ho.session.in_house_users[0], tuple):
            ih_users = [
                "%s%s" % (p, c) for (p, c) in mxcube.mxcubecore.beamline_ho.session.in_house_users
            ]
        else:
            ih_users = mxcube.mxcubecore.beamline_ho.session.in_house_users
        users = [user for user in users if user not in ih_users]

    return users


def set_operator():
    active_in_control = False

    import pdb
    pdb.set_trace()

    for _u in User.query.all():
        if _u.is_authenticated and _u.in_control:
            active_in_control = True

    # If no user is currently in control set this user to be
    # in control.
    if not active_in_control:
        db_set_in_control(current_user, True)

    # Set active proposal to that of the active user
    if mxcube.mxcubecore.beamline_ho.lims.loginType.lower() != "user":
        # The name of the user is the proposal when using proposalType login
        limsutils.select_proposal(current_user.name)


def users():
    return mxcube.USERS


def valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            return Response(status=404)
        else:
            return f(*args, **kwargs)

    return wrapped


def require_control(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if current_user.is_authenticated and not is_operator():
            return Response(status=401)
        else:
            return f(*args, **kwargs)

    return wrapped


def ws_valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            flask_socketio.disconnect()
        else:
            return f(*args, **kwargs)

    return wrapped


def append_message(message, sid):
    user = current_user.name

    data = {
        "message": message,
        "sid": sid,
        "user": user,
        "host": remote_addr(),
        "date": datetime.datetime.now().strftime("%H:%M"),
    }

    MESSAGES.append(data)
    db_add_message(current_user, message)
    server.emit("ra_chat_message", data, namespace="/hwr")


def get_all_messages():
    message_db_list = mxcube.server.user_datastore.get_all_messages()
    message_list = []
    
    for m in message_list:
        user = m.users.all()[0]

        message_list.append({
            "message": message,
            "sid": user.last_session_id,
            "user": user.username,
            "host": user.last_login_ip,
            "date": message.at.strftime("%H:%M"),
        })

    return message_list


def remote_addr():
    hdr = request.headers.get("x-forwarded-for", request.remote_addr)

    return str(hdr).split(",")[-1]


def is_local_network(ip):
    localhost = socket.gethostbyname_ex(socket.gethostname())[2][0]
    localhost_range = ".".join(localhost.split(".")[0:2])
    private_address = ".".join(ip.split(".")[0:2])

    return private_address == localhost_range


def is_local_host():
    try:
        localhost_list = socket.gethostbyname_ex(socket.gethostname())[2]
    except Exception:
        localhost_list = []

    localhost_list.append("127.0.0.1")

    remote_address = remote_addr()

    # Remote address is sometimes None for instance when using the test
    # client, no real connection is made, assume that we are local host
    if remote_address in [None, "None", ""]:
        remote_address = "127.0.0.1"

    return remote_address in localhost_list or is_local_network(remote_address)


def is_inhouse_user(user_id):
    user_id_list = [
        "%s%s" % (code, number)
        for (code, number) in mxcube.mxcubecore.beamline_ho.session.in_house_users
    ]

    return user_id in user_id_list


def login(login_id, password):
    import pdb
    pdb.set_trace
    try:
        login_res = limsutils.lims_login(login_id, password, create_session=False)
        inhouse = is_inhouse_user(login_id)

        info = {
            "valid": limsutils.lims_valid_login(login_res),
            "local": is_local_host(),
            "existing_session": limsutils.lims_existing_session(login_res),
            "inhouse": inhouse,
        }

        _users = logged_in_users(exclude_inhouse=True)

        # Only allow in-house log-in from local host
        if inhouse and not (inhouse and is_local_host()):
            raise Exception("In-house only allowed from localhost")

        # Only allow other users to log-in if they are from the same proposal
        if (not inhouse) and _users and (login_id not in _users):
            raise Exception("Another user is already logged in")

        # Only allow local login when remote is disabled
        if not mxcube.ALLOW_REMOTE and not is_local_host():
            raise Exception("Remote access disabled")

        # Only allow remote logins with existing sessions
        if limsutils.lims_valid_login(login_res) and is_local_host():
            if not limsutils.lims_existing_session(login_res):
                login_res = limsutils.create_lims_session(login_res)

            msg = "[LOGIN] Valid login from local host (%s)" % str(info)
            logging.getLogger("MX3.HWR").info(msg)
        elif limsutils.lims_valid_login(login_res) and limsutils.lims_existing_session(
            login_res
        ):
            msg = "[LOGIN] Valid remote login from %s with existing session (%s)"
            msg += msg % (remote_addr(), str(info))
            logging.getLogger("MX3.HWR").info(msg)
        else:
            logging.getLogger("MX3.HWR").info("Invalid login %s" % info)
            raise Exception(str(info))
    except BaseException:
        raise
    else:
        import pdb
        pdb.set_trace()
        if not "sid" in session:
            session["sid"] = str(uuid.uuid4())

        user = db_create_user(login_id, password, login_res)
        login_user(user)

        address, barcode = scutils.get_loaded_sample()

        # If A sample is mounted (and not already marked as such),
        # get sample changer contents and add mounted sample to the queue
        if not scutils.get_current_sample() and address:
            scutils.get_sample_list()

        # For the moment not loading queue from persistent storage (redis),
        # uncomment to enable loading.
        # qutils.load_queue(session)
        # logging.getLogger('MX3.HWR').info('Loaded queue')
        logging.getLogger("MX3.HWR").info("[QUEUE] %s " % qutils.queue_to_json())

        set_operator()

        return login_res["status"]


def signout():
    user = current_user

    # If operator logs out clear queue and sample list
    if is_operator():
        qutils.save_queue(session)
        qutils.clear_queue()
        mxcube.mxcubecore.beamline_ho.sample_view.clear_all()
        limsutils.init_sample_list()

        qutils.init_queue_settings()

        if hasattr(mxcube.mxcubecore.beamline_ho.session, "clear_session"):
            mxcube.mxcubecore.beamline_ho.session.clear_session()

        mxcube.CURRENTLY_MOUNTED_SAMPLE = ""

        db_set_in_control(current_user, False)

        msg = "User %s signed out" % user.username
        logging.getLogger("MX3.HWR").info(msg)

    session.clear()
    logout_user()


def login_info():
    # If user object has limsdata attribute if logged in:
    if hasattr(current_user, "limsdata"):
        login_info = json.loads(current_user.limsdata)
    else:
        login_info = {}

    set_operator()

    #login_info = login_info["loginRes"] if login_info is not None else {}
    login_info = limsutils.convert_to_dict(login_info)

    proposal_list = [
        {
            "code": prop["Proposal"]["code"], 
            "number": prop["Proposal"]["number"],
            "proposalId": prop["Proposal"]["proposalId"]
         }
            for prop in login_info["proposalList"]
    ]

    res = {
        "synchrotronName": mxcube.mxcubecore.beamline_ho.session.synchrotron_name,
        "beamlineName": mxcube.mxcubecore.beamline_ho.session.beamline_name,
        "loggedIn": True,
        "loginType": mxcube.mxcubecore.beamline_ho.lims.loginType.title(),
        "proposalList": proposal_list,
        "user": {
            "username":current_user.username,
            "email": current_user.email,
            "isstaff": "staff" in current_user.roles,
            "name": getattr(current_user, "name", ""),
            "inControl": current_user.in_control,
            "ip": current_user.last_login_ip,
        },
    }
    
    res["selectedProposal"] = "%s%s" % (
        mxcube.mxcubecore.beamline_ho.session.proposal_code,
        mxcube.mxcubecore.beamline_ho.session.proposal_number
    )

    res["selectedProposalID"] = mxcube.mxcubecore.beamline_ho.session.proposal_id

    return current_user, res


def send_feedback():
    sender_data = request.get_json()
    sender_data["LOGGED_IN_USER"] = current_user.name

    utils.send_feedback(sender_data)


def db_create_user(user, password, lims_data):
    sid = session["sid"]
    user_datastore = mxcube.server.user_datastore
    username=f"{user}-{sid}"

    # Make sure that the roles staff and incontrol always
    # exists
    if not user_datastore.find_role("staff"):
        user_datastore.create_role(name="staff")
        user_datastore.create_role(name="incontrol")
        mxcube.server.user_datastore.commit()

    _u = user_datastore.find_user(username=username)

    if not _u:
        user_datastore.create_user(
            username=username,
            password=hash_password("password"),
            name=user,
            last_session_id=sid,
            selected_proposal=user,
            limsdata=json.dumps(lims_data),
            roles=["staff"]
        )
    else:
        _u.limsdata=json.dumps(lims_data)

    mxcube.server.user_datastore.commit()

    return user_datastore.find_user(username=username)


def db_set_in_control(user, control):
    user_datastore = mxcube.server.user_datastore

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

    mxcube.server.user_datastore.commit()


def db_add_message(user, message):
    m = mxcube.server.user_datastore.create_message(message=message)
    mxcube.server.user_datastore.add_message_to_user(user, m)
    mxcube.server.user_datastore.commit()