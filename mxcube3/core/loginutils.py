from __future__ import absolute_import
import datetime
import socket
import functools
import logging

from collections import deque
from flask import session, request, Response

from mxcube3 import mxcube

from mxcube3 import blcontrol

from mxcube3 import state_storage
from mxcube3 import socketio

from . import limsutils
from . import utils
from . import qutils
from . import scutils


PENDING_EVENTS = deque()
DISCONNECT_HANDLED = True
MESSAGES = []


def create_user(loginID, host, sid, lims_data=None):
    return {
        "loginID": loginID,
        "host": host,
        "sid": sid,
        "name": "",
        "operator": False,
        "requestsControl": False,
        "message": "",
        "socketio_sid": None,
        "limsData": lims_data,
    }


def add_user(user):
    mxcube.USERS[user["sid"]] = user


def remove_user(sid):
    user = mxcube.USERS.pop(sid)

    if user["operator"]:
        state_storage.flush()
        flush()
    else:
        socketio.emit("observerLogout", user, namespace="/hwr")
        socketio.emit("observersChanged", get_observers(), namespace="/hwr")


def get_user_by_sid(sid):
    return mxcube.USERS.get(sid, None)


def get_observers():
    return [user for user in users().values() if not user["operator"]]


def get_observer_name():
    name = None
    user = get_user_by_sid(session.sid)

    if user:
        name = user["name"]

    return name


def get_operator():
    return next(iter([user for user in users().values() if user["operator"]]), None)


def is_operator(sid):
    user = get_operator()
    return user and user["sid"] == sid


def logged_in_users(exclude_inhouse=False):
    users = [user["loginID"] for user in mxcube.USERS.values()]

    if exclude_inhouse:
        if isinstance(blcontrol.session.in_house_users[0], tuple):
            ih_users = ["%s%s" % (p, c) for (p, c) in blcontrol.session.in_house_users]
        else:
            ih_users = blcontrol.session.in_house_users
        users = [user for user in users if user not in ih_users]

    return users


def set_operator(sid):
    # Clear previous operator
    for user in users().values():
        user["operator"] = False
        user["requestsControl"] = False

    user = get_user_by_sid(sid)
    user["operator"] = True

    if blcontrol.db_connection.loginType.lower() != "user":
        limsutils.select_proposal(user["loginID"])


def users():
    return mxcube.USERS


def valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not get_user_by_sid(session.sid):
            return Response(status=404)
        else:
            return f(*args, **kwargs)

    return wrapped


def append_message(message, sid):
    user = get_observer_name()

    if not user:
        user = "*" + session["loginInfo"]["loginID"]

    data = {
        "message": message,
        "sid": sid,
        "user": user,
        "host": remote_addr(),
        "date": datetime.datetime.now().strftime("%H:%M"),
    }

    MESSAGES.append(data)
    socketio.emit("ra_chat_message", data, namespace="/hwr")


def get_all_messages():
    return MESSAGES


def flush():
    global PENDING_EVENTS
    PENDING_EVENTS = deque()


def _event_callback():
    event_id, event, json_dict, kw = PENDING_EVENTS.popleft()
    emit_pending_events()


def emit_pending_events():
    try:
        event_id, event, json_dict, kwargs = PENDING_EVENTS[0]
    except IndexError:
        pass
    else:
        return _emit(event, json_dict, **kwargs)


def _emit(event, json_dict, **kwargs):
    kw = dict(kwargs)
    kw["callback"] = _event_callback
    kw["room"] = get_operator()["socketio_sid"]
    socketio.emit(event, json_dict, **kw)


def safe_emit(event, json_dict, **kwargs):
    PENDING_EVENTS.append((id(json_dict), event, json_dict, kwargs))
    if len(PENDING_EVENTS) == 1:
        emit_pending_events()


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
        "%s%s" % (code, number) for (code, number) in blcontrol.session.in_house_users
    ]

    return user_id in user_id_list


def login(login_id, password):
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
        add_user(create_user(login_id, remote_addr(), session.sid, login_res))

        session["loginInfo"] = {
            "loginID": login_id,
            "password": password,
            "loginRes": login_res,
        }

        # Create a new queue just in case any previous queue was not cleared
        # properly
        blcontrol.queue = qutils.new_queue()

        sample = blcontrol.sample_changer.getLoadedSample()

        # If A sample is mounted (and not already marked as such),
        # get sample changer contents and add mounted sample to the queue
        if not scutils.get_current_sample() and sample:
            scutils.get_sample_list()

        # For the moment not loading queue from persistent storage (redis),
        # uncomment to enable loading.
        # qutils.load_queue(session)
        # logging.getLogger('MX3.HWR').info('Loaded queue')
        logging.getLogger("MX3.HWR").info("[QUEUE] %s " % qutils.queue_to_json())

        if not get_operator():
            set_operator(session.sid)

        return login_res["status"]


def signout():
    user = get_user_by_sid(session.sid)

    # If operator logs out clear queue and sample list
    if is_operator(session.sid):
        qutils.save_queue(session)
        blcontrol.queue = qutils.new_queue()
        blcontrol.shapes.clear_all()
        limsutils.init_sample_list()

        qutils.init_queue_settings()

        if hasattr(blcontrol.session, "clear_session"):
            blcontrol.session.clear_session()

        mxcube.CURRENTLY_MOUNTED_SAMPLE = ""

        user = get_user_by_sid(session.sid)
        msg = "User %s signed out" % user
        logging.getLogger("MX3.HWR").info(msg)

    remove_user(session.sid)
    session.clear()


def login_info(login_info):
    login_info = login_info["loginRes"] if login_info is not None else {}
    login_info = limsutils.convert_to_dict(login_info)

    res = {
        "synchrotron_name": blcontrol.session.synchrotron_name,
        "beamline_name": blcontrol.session.beamline_name,
        "loginType": blcontrol.db_connection.loginType.title(),
        "loginRes": login_info,
        "master": is_operator(session.sid),
        "observerName": get_observer_name(),
    }

    user = get_user_by_sid(session.sid)
    proposal = session["proposal"]["Proposal"] if "proposal" in session else None

    if proposal:
        res["selectedProposal"] = "%s%s" % (proposal["code"], proposal["number"])
        res["selectedProposalID"] = proposal["proposalId"]
    else:
        res["selectedProposal"] = ""
        res["selectedProposalID"] = ""

    return user, res


def send_feedback():
    sender_data = request.get_json()
    sender_data["LOGGED_IN_USER"] = get_user_by_sid(session.sid)["loginID"]

    utils.send_feedback(sender_data)
