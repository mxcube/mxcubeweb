from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import datetime
import socket
import functools
import ipaddress
import logging

from collections import deque
from flask import session, request, Response
import flask_socketio

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

def lims_login_type():
    return blcontrol.beamline.lims.loginType.lower()

def create_user(loginID, host, sid, user_type, lims_data=None):
    return {"loginID": loginID,
            "host": socket.gethostbyaddr(host)[0],
            "sid": sid,
            "type": user_type,
            "name": "",
            "operator": False,
            "requestsControl": False,
            "message": "",
            "socketio_sid": None,
            "limsData": lims_data}


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
    socketio.emit("usersChanged", get_users(), namespace='/hwr')
    return user


def get_user_by_sid(sid):
    return mxcube.USERS.get(sid, None)


def get_user_by_name(username):
    for sid in mxcube.USERS.keys():
        a_user = mxcube.USERS.get(sid)
        if a_user.get('loginID') == username:
            return a_user
    return None


def get_users():
    return [user for user in users().values()]


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


def user_type(sid):
    user = get_user_by_sid(sid)
    return user.get('type')


def define_user_type(local, is_staff, common_proposal):
    """
    User type can be: local, remote, staff
    """
    if is_staff and mxcube.USERS:
        user_type = 'staff'
    else:
        user_type = 'local' if local  else 'remote'

    return user_type


def logged_in_users(exclude_inhouse=False):
    users = [user["loginID"] for user in mxcube.USERS.values()]

    if exclude_inhouse:
        if isinstance(blcontrol.beamline.session.in_house_users[0], tuple):
            ih_users = [
                "%s%s" % (p, c) for (p, c) in blcontrol.beamline.session.in_house_users
            ]
        else:
            ih_users = blcontrol.beamline.session.in_house_users
        users = [user for user in users if user not in ih_users]

    return users


def set_operator(sid):
    # Clear previous operator
    for user in users().values():
        user["operator"] = False
        user["requestsControl"] = False

    user = get_user_by_sid(sid)
    user["operator"] = True

    if blcontrol.beamline.lims.loginType.lower() != "user":
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

def require_control(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not is_operator(session.sid):
            return Response(status=401)
        else:
            return f(*args, **kwargs)

    return wrapped

def ws_valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not get_user_by_sid(session.sid):
            flask_socketio.disconnect()
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

    mxcube.MESSAGES.append(data)
    socketio.emit("ra_chat_message", data, namespace="/hwr")


def get_all_messages():
    return mxcube.MESSAGES


def clear_messages():
    mxcube.MESSAGES[:] = []


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
    try:
        _address = mxcube.session.remote_address
    except:
        _address = None
    if ip == _address:
        return False
    _ip = ipaddress.ip_address(unicode(ip))
    return _ip.is_private


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
        for (code, number) in blcontrol.beamline.session.in_house_users
    ]

    return user_id in user_id_list


def login(login_id, password):
    try:
        login_res = limsutils.lims_login(login_id, password, create_session=False)
        if login_res["status"]["code"] != "ok":
            return deny_access("Could not authenticate")

        inhouse = is_inhouse_user(login_id)

        info = {
            "valid": limsutils.lims_valid_login(login_res),
            "local": is_local_host(),
            "existing_session": limsutils.lims_existing_session(login_res),
            "inhouse": inhouse,
        }

        _users = logged_in_users(exclude_inhouse=True)
        
        common_proposal = False
        if mxcube.SELECTED_PROPOSAL is not None:
            for prop in login_res['proposalList']:
                _p = prop['Proposal']['code'] + prop['Proposal']['number']
                if _p == mxcube.SELECTED_PROPOSAL:
                    common_proposal = True

        if (login_id in _users):
            raise Exception("Login rejected, you are already logged in")

        # Only allow in-house log-in from local host
        if inhouse and not (inhouse and is_local_host()):
            raise Exception("In-house only allowed from localhost")
        
        # staff consideration only makes sense for users login
        if lims_login_type() == 'user':
            privileged = limsutils.lims_is_staff(login_id)
        else:
            # for proposal login, this corresponds to the proposal being inhouse
            privileged = inhouse

        # Only allow other users to log-in if they are from the same proposal
        # or if they are staff
        if not privileged and not common_proposal and _users and (login_id not in _users):
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
    except BaseException as ex:
        logging.getLogger("HWR").error('Login error %s' %ex)
        raise Exception(str(ex))
    else:
        if not logged_in_users(exclude_inhouse=False):
            # Create a new queue just in case any previous queue was not cleared
            # properly but only if there is not any user logged in
            qutils.clear_queue()
        user_type = define_user_type(info['local'], privileged, common_proposal)
        add_user(create_user(login_id, remote_addr(), session.sid, user_type, login_res))
        socketio.emit("usersChanged", get_users(), namespace='/hwr')

        session["loginInfo"] = {
            "loginID": login_id,
            "password": password,
            "loginRes": login_res,
        }

        sample = blcontrol.beamline.sample_changer.getLoadedSample()
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


def clear_all():
    qutils.save_queue(session)
    qutils.clear_queue()
    blcontrol.beamline.microscope.shapes.clear_all()
    limsutils.init_sample_list()

    qutils.init_queue_settings()
    if hasattr(blcontrol.beamline.session, "clear_session"):
        blcontrol.beamline.session.clear_session()

    if mxcube.CURRENTLY_MOUNTED_SAMPLE:
        if mxcube.CURRENTLY_MOUNTED_SAMPLE.get('location', '') == 'Manual':
            mxcube.CURRENTLY_MOUNTED_SAMPLE = ''

    mxcube.SELECTED_PROPOSAL = None
    mxcube.SELECTED_PROPOSAL_ID = None
    state_storage.flush()

    session.clear()


def signout():
    user = get_user_by_sid(session.sid)
    if not logged_in_users(exclude_inhouse=False):
    # If last user logs out clear queue and sample list
        clear_all()

    msg = "User %s signed out" % user
    logging.getLogger("MX3.HWR").info(msg)

    remove_user(session.sid)


def forceusersignout():
    logging.getLogger("HWR").info('Forcing signout of user')
    user_id = request.get_json()['sid']
    user = get_user_by_sid(user_id)
    # try by name
    if user is None:
        user = get_user_by_name(user_id)
    remove_user(user.get('sid'))
    socketio.emit("signout", user, room=user["socketio_sid"], namespace='/hwr')
    logging.getLogger('HWR').info('[Login] %s user forced signout' % user['loginID'])

    users = get_users()

    if len(users) == 0:
        # no one else is connected
        # we are here because the user force logut itself
        clear_all()

    if len(users) == 1 and users[0]['type'] == 'staff':
        # if the only remaining user is staff clean all
        # we are here because a staff user kicked out a normal user
        staff_id = users[0]['sid']
        remove_user(staff_id)
        clear_all()
        socketio.emit("signout", {}, namespace='/hwr')

def login_info(login_info):
    loginID = login_info["loginID"] if login_info is not None else None
    login_info = login_info["loginRes"] if login_info is not None else {}
    login_info = limsutils.convert_to_dict(login_info)

    res = {
        "synchrotron_name": blcontrol.beamline.session.synchrotron_name,
        "beamline_name": blcontrol.beamline.session.beamline_name,
        "loginType": blcontrol.beamline.lims.loginType.title(),
        "loginID": loginID,
        "host": socket.gethostbyaddr(remote_addr())[0],
        "loginRes": login_info,
        "master": is_operator(session.sid),
        "observerName": get_observer_name(),
    }

    user = get_user_by_sid(session.sid)
    proposal = session["proposal"]["Proposal"] if "proposal" in session else None

    if mxcube.SELECTED_PROPOSAL is not None:
        res["selectedProposal"] = mxcube.SELECTED_PROPOSAL
        res["selectedProposalID"] = mxcube.SELECTED_PROPOSAL_ID
    else:
        res["selectedProposal"] = None
        res["selectedProposalID"] = None

    return user, res


def send_feedback():
    sender_data = request.get_json()
    sender_data["LOGGED_IN_USER"] = get_user_by_sid(session.sid)["loginID"]

    utils.send_feedback(sender_data)
