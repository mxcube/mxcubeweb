# -*- coding: utf-8 -*-
import gevent
import logging
from flask import (session, jsonify, Response, request, make_response,
                   copy_current_request_context)


from mxcube3 import socketio
from mxcube3 import app as mxcube
from mxcube3.routes import loginutils
from mxcube3.routes import limsutils

@mxcube.route("/mxcube/api/v0.1/ra/request_control", methods=["POST"])
@mxcube.restrict
def request_control():
    """
    """
    @copy_current_request_context
    def handle_timeout_gives_control(sid, timeout=30):
        gevent.sleep(timeout)

        if mxcube.TIMEOUT_GIVES_CONTROL:
            user = loginutils.get_user_by_sid(sid)

            # Pass control to user if still waiting
            if user.get("requestsControl"):
                toggle_operator(sid, "Timeout expired, you have control")

    data = request.get_json()
    remote_addr = loginutils.remote_addr()

    # Is someone already asking for control
    for observer in loginutils.get_observers():
        if observer["requestsControl"] and observer["host"] != remote_addr:
            msg = "Another user is already asking for control"
            return make_response(msg, 409)

    user = loginutils.get_user_by_sid(session.sid)

    user["name"] = data["name"]
    user["requestsControl"] = data["control"]
    user["message"] = data["message"]

    observers = loginutils.get_observers()
    gevent.spawn(handle_timeout_gives_control, session.sid, timeout=10)

    socketio.emit("observersChanged", observers, namespace='/hwr')

    return make_response("", 200)


@mxcube.route("/mxcube/api/v0.1/ra/take_control", methods=["POST"])
@mxcube.restrict
def take_control():
    """
    """
    # Already master do nothing
    if loginutils.is_operator(session.sid):
        return make_response("", 200)
    
    login_id = session['loginInfo'].get('loginID')
    # Not inhouse user so not allowed to take control by force,
    # return error code
    is_in_house_user = login_id in mxcube.session.in_house_users
    is_in_house_session = session['loginInfo']['loginRes']['Session']['is_inhouse']

    if is_in_house_session or is_in_house_user:
        toggle_operator(session.sid, "You were given control")
        return make_response("", 200)
    else:
        return make_response("", 409)


@mxcube.route("/mxcube/api/v0.1/ra/give_control", methods=["POST"])
@mxcube.restrict
def give_control():
    """
    """
    sid = request.get_json().get("sid")
    toggle_operator(sid, "You were given control")

    return make_response("", 200)


def toggle_operator(new_op_sid, message):
    current_op = loginutils.get_operator()

    new_op = loginutils.get_user_by_sid(new_op_sid)
    loginutils.set_operator(new_op["sid"])
    new_op["message"] = message

    observers = loginutils.get_observers()

    # Append the new data path so that it can be updated on the client
    new_op["rootPath"] = mxcube.session.get_base_image_directory()

    # Current op might have logged out, while this is happening
    if current_op:
        current_op["rootPath"] = mxcube.session.get_base_image_directory()
        current_op["message"] = message
        socketio.emit("setObserver", current_op, room=current_op["socketio_sid"], namespace='/hwr')

    socketio.emit("observersChanged", observers, namespace='/hwr')
    socketio.emit("setMaster", new_op, room=new_op["socketio_sid"], namespace='/hwr')


def remain_observer(observer_sid, message):
    observer = loginutils.get_user_by_sid(observer_sid)
    observer["message"] = message

    socketio.emit("setObserver", observer, room=observer["socketio_sid"], namespace='/hwr')


@mxcube.route("/mxcube/api/v0.1/ra", methods=["GET"])
@mxcube.restrict
def observers():
    """
    """
    data = {'observers': loginutils.get_observers(),
            'sid': session.sid,
            'master': loginutils.is_operator(session.sid),
            'observerName': loginutils.get_observer_name(),
            'type': loginutils.user_type(session.sid),
            'allowRemote': mxcube.ALLOW_REMOTE,
            'timeoutGivesControl': mxcube.TIMEOUT_GIVES_CONTROL
    }

    return jsonify(data=data)


@mxcube.route("/mxcube/api/v0.1/ra/allow_remote", methods=["POST"])
@mxcube.restrict
def allow_remote():
    """
    """
    allow = request.get_json().get("allow")

    if mxcube.ALLOW_REMOTE and allow == False:
         socketio.emit("forceSignoutObservers", {}, namespace='/hwr')

    mxcube.ALLOW_REMOTE = allow

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/ra/timeout_gives_control", methods=["POST"])
@mxcube.restrict
def timeout_gives_control():
    """
    """
    control = request.get_json().get("timeoutGivesControl")
    mxcube.TIMEOUT_GIVES_CONTROL = control

    return Response(status=200)


def observer_requesting_control():
    observer = None

    for o in loginutils.get_observers():
        if o["requestsControl"]:
            observer = o

    return observer


@mxcube.route("/mxcube/api/v0.1/ra/request_control_response", methods=["POST"])
@mxcube.restrict
def request_control_response():
    """
    """
    data = request.get_json()
    new_op = observer_requesting_control()
    current_op = loginutils.get_operator()

    # Request was denied
    if not data['giveControl']:
        remain_observer(new_op["sid"], data["message"])
    else:
        toggle_operator(new_op["sid"], data["message"])

    new_op["requestsControl"] = False

    return make_response("", 200)


@mxcube.route("/mxcube/api/v0.1/ra/chat", methods=["POST"])
@mxcube.restrict
def append_message():
    message = request.get_json().get("message", "")
    sid = request.get_json().get("sid", "")

    if message and sid:
       loginutils.append_message(message, sid)

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/ra/chat", methods=["GET"])
@mxcube.restrict
def get_all_mesages():
    return jsonify({"messages": loginutils.get_all_messages()})


@socketio.on('connect', namespace='/hwr')
def connect():
    user = loginutils.get_user_by_sid(session.sid)

    # Make sure user is logged, session may have been closed i.e by timeout
    if user:
        user["socketio_sid"] = request.sid

    # (Note: User is logged in if operator)
    if loginutils.is_operator(session.sid):
        loginutils.emit_pending_events()

        if not mxcube.queue.queue_hwobj.is_executing() and \
           not loginutils.DISCONNECT_HANDLED:
            loginutils.DISCONNECT_HANDLED = True
            socketio.emit("resumeQueueDialog", namespace='/hwr')
            msg = 'Client reconnected, Queue was previously stopped, asking '
            msg += 'client for action'
            logging.getLogger('HWR').info(msg)


@socketio.on('disconnect', namespace='/hwr')
def disconnect():
    if loginutils.is_operator(session.sid) and \
       mxcube.queue.queue_hwobj.is_executing():

        loginutils.DISCONNECT_HANDLED = False
        mxcube.queue.queue_hwobj.pause(True)
        logging.getLogger('HWR').info('Client disconnected, pausing queue')


@socketio.on('setRaMaster', namespace='/hwr')
def set_master(data):
    loginutils.emit_pending_events()

    return session.sid


@socketio.on('setRaObserver', namespace='/hwr')
def set_observer(data):
    name = data.get("name", "")
    observers = loginutils.get_observers()
    observer = loginutils.get_user_by_sid(session.sid)

    if observer and name :
        observer["name"] = name
        socketio.emit("observerLogin", observer, include_self=False, namespace='/hwr')

    socketio.emit("observersChanged", observers, namespace='/hwr')

    return session.sid
