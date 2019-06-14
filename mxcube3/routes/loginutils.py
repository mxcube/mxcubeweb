import datetime
import socket
import functools
import ipaddress

from collections import deque
from flask import session, request, Response, jsonify

from mxcube3 import app as mxcube
from mxcube3 import state_storage
from mxcube3 import socketio


PENDING_EVENTS = deque()
DISCONNECT_HANDLED = True
MESSAGES = []
USER_TYPES = {True: 'local', False: 'remote'}

def create_user(loginID, host, sid, local, lims_data=None):
    return {"loginID": loginID,
            "host": socket.gethostbyaddr(host)[0],
            "sid": sid,
            "type": USER_TYPES[local],
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
        socketio.emit("observerLogout", user, namespace='/hwr')
        socketio.emit("observersChanged", get_observers(), namespace='/hwr')


def get_user_by_sid(sid):
    return mxcube.USERS.get(sid, None)


def deny_access(msg):
    resp = jsonify({"msg": msg})
    resp.code = 409
    return resp


def get_users():
    return [user for user in users().itervalues()]


def get_observers():
    return [user for user in users().itervalues() if not user["operator"]]


def get_observer_name():
    name = None
    user = get_user_by_sid(session.sid)

    if user:
        name = user["name"]

    return name


def get_operator():
    return next(iter([user for user in users().itervalues() \
                      if user["operator"]]), None)


def is_operator(sid):
    user = get_operator()
    return user and user["sid"] == sid


def user_type(sid):
    user = get_user_by_sid(sid)
    return user.get('type')


def logged_in_users(exclude_inhouse=False):
    users = [user["loginID"] for user in mxcube.USERS.itervalues()]

    if exclude_inhouse:
        if type(mxcube.session.in_house_users[0]) == tuple:
            ih_users =["%s%s"% (p, c) for (p, c) in mxcube.session.in_house_users]
        else:
            ih_users = mxcube.session.in_house_users
        users = [user for user in users if user not in ih_users]

    return users


def set_operator(sid):
    from mxcube3.routes.limsutils import select_proposal

    # Clear previous operator
    for user in users().itervalues():
        user["operator"] = False
        user["requestsControl"] = False

    user = get_user_by_sid(sid)
    user["operator"] = True

    if mxcube.db_connection.loginType.lower() != 'user':
        select_proposal(user["loginID"])

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
        user = "*"  + session["loginInfo"]["loginID"]

    data = {"message": message, "sid": sid,
            "user": user, "host":remote_addr(),
            "date": datetime.datetime.now().strftime("%H:%M")}

    MESSAGES.append(data)
    socketio.emit('ra_chat_message', data, namespace='/hwr')


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
    kw['callback'] = _event_callback
    kw['room'] = get_operator()["socketio_sid"]
    socketio.emit(event, json_dict, **kw)


def safe_emit(event, json_dict, **kwargs):
    PENDING_EVENTS.append((id(json_dict), event, json_dict, kwargs))
    if len(PENDING_EVENTS) == 1:
        emit_pending_events()


def remote_addr():
    hdr = request.headers.get('x-forwarded-for', request.remote_addr)

    return str(hdr).split(',')[-1]


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
    localhost_list = socket.gethostbyname_ex(socket.gethostname())[2]
    localhost_list.append("127.0.0.1")

    remote_addres = remote_addr()

    return remote_addres in localhost_list or is_local_network(remote_addres)
