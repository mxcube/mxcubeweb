# -*- coding: utf-8 -*-
import gevent
import logging
import flask

from flask import (
    Blueprint,
    session,
    jsonify,
    Response,
    request,
    make_response,
    copy_current_request_context,
)

from flask_socketio import join_room, leave_room
from flask_login import current_user

from mxcubecore import HardwareRepository as HWR

from mxcube3.core.util.networkutils import remote_addr

DISCONNECT_HANDLED = True


def init_route(app, server, url_prefix):
    bp = Blueprint("remote_access", __name__, url_prefix=url_prefix)

    @bp.route("/request_control", methods=["POST"])
    @server.restrict
    def request_control():
        """
        """

        @copy_current_request_context
        def handle_timeout_gives_control(sid, timeout=30):
            gevent.sleep(timeout)

            if app.TIMEOUT_GIVES_CONTROL:
                # Pass control to user if still waiting
                if current_user.requests_control:
                    toggle_operator(
                        current_user.username, "Timeout expired, you have control"
                    )

        data = request.get_json()

        # Is someone already asking for control
        for observer in app.usermanager.get_observers():
            if observer.requests_control and observer.username != current_user.username:
                msg = "Another user is already asking for control"
                return make_response(msg, 409)

        current_user.requests_control = data["control"]
        server.user_datastore.commit()

        gevent.spawn(handle_timeout_gives_control, current_user.username, timeout=10)

        op = app.usermanager.get_operator()

        data = {
            "observers": [_u.todict() for _u in app.usermanager.get_observers()],
            "message": "",
            "operator": op.todict() if op else {},
        }

        server.emit("observersChanged", data, namespace="/hwr")

        return make_response("", 200)

    @bp.route("/take_control", methods=["POST"])
    @server.restrict
    def take_control():
        """
        """
        # Already master do nothing
        if app.usermanager.is_operator():
            return make_response("", 200)

        # Not inhouse user so not allowed to take control by force,
        # return error code
        if not current_user.isstaff():
            return make_response("", 409)

        toggle_operator(current_user.username, "You were given control")

        return make_response("", 200)

    @bp.route("/give_control", methods=["POST"])
    @server.restrict
    def give_control():
        """
        """
        username = request.get_json().get("username")
        toggle_operator(username, "You were given control")

        return make_response("", 200)

    def toggle_operator(username, message):
        oldop = app.usermanager.get_operator()
        newop = app.usermanager.set_operator(username)

        join_room("observers", sid=oldop.socketio_session_id, namespace="/ui_state")
        leave_room("observers", sid=newop.socketio_session_id, namespace="/ui_state")

        data = {
            "observers": [_u.todict() for _u in app.usermanager.get_observers()],
            "message": message,
            "operator": newop.todict(),
        }

        server.emit("observersChanged", data, namespace="/hwr")

    def remain_observer(observer_sid, message):
        observer = app.usermanager.get_user_by_sid(observer_sid)
        observer["message"] = message

        server.emit(
            "setObserver", observer, room=observer["socketio_sid"], namespace="/hwr"
        )

    @bp.route("/", methods=["GET"])
    @server.restrict
    def rasettings():
        """
        """
        data = {
            "observers": [_u.todict() for _u in app.usermanager.get_observers()],
            "allowRemote": app.ALLOW_REMOTE,
            "timeoutGivesControl": app.TIMEOUT_GIVES_CONTROL,
        }

        return jsonify(data=data)

    @bp.route("/allow_remote", methods=["POST"])
    @server.restrict
    def allow_remote():
        """
        """
        allow = request.get_json().get("allow")

        if app.ALLOW_REMOTE and allow == False:
            server.emit("forceSignoutObservers", {}, namespace="/hwr")

        app.ALLOW_REMOTE = allow

        return Response(status=200)

    @bp.route("/timeout_gives_control", methods=["POST"])
    @server.restrict
    def timeout_gives_control():
        """
        """
        control = request.get_json().get("timeoutGivesControl")
        app.TIMEOUT_GIVES_CONTROL = control

        return Response(status=200)

    def observer_requesting_control():
        observer = None

        for o in app.usermanager.get_observers():
            if o.requests_control:
                observer = o

        return observer

    @bp.route("/request_control_response", methods=["POST"])
    @server.restrict
    def request_control_response():
        """
        """
        data = request.get_json()
        new_op = observer_requesting_control()

        # Request was denied
        if not data["giveControl"]:
            remain_observer(new_op.username, data["message"])
        else:
            toggle_operator(new_op.username, data["message"])

        new_op.requests_control = False
        app.usermanager.update_user(new_op)

        return make_response("", 200)

    @bp.route("/chat", methods=["POST"])
    def append_message():
        message = request.get_json().get("message", "")
        username = request.get_json().get("username", "")

        if message and username:
            app.chat.append_message(message, username)

        return Response(status=200)

    @bp.route("/chat", methods=["GET"])
    @server.restrict
    def get_all_mesages():
        return jsonify({"messages": app.chat.get_all_messages()})

    @server.flask_socketio.on("connect", namespace="/hwr")
    @server.ws_restrict
    def connect():
        global DISCONNECT_HANDLED
        current_user.socketio_session_id = request.sid
        app.usermanager.update_user(current_user)

        if app.usermanager.is_operator():
            if not HWR.beamline.queue_manager.is_executing() and not DISCONNECT_HANDLED:
                DISCONNECT_HANDLED = True
                server.emit("resumeQueueDialog", namespace="/hwr")
                msg = "Client reconnected, Queue was previously stopped, asking "
                msg += "client for action"
                logging.getLogger("HWR").info(msg)

        op = app.usermanager.get_operator()

        data = {
            "observers": [_u.todict() for _u in app.usermanager.get_observers()],
            "message": "",
            "operator": op.todict() if op else {},
        }

        server.emit("observersChanged", data, namespace="/hwr")

    @server.flask_socketio.on("disconnect", namespace="/hwr")
    def disconnect():
        global DISCONNECT_HANDLED

        if app.usermanager.is_operator() and HWR.beamline.queue_manager.is_executing():
            DISCONNECT_HANDLED = False
            logging.getLogger("HWR").info("Client disconnected")

        op = app.usermanager.get_operator()

        data = {
            "observers": [_u.todict() for _u in app.usermanager.get_observers()],
            "message": "",
            "operator": op.todict() if op else {},
        }

        server.emit("observersChanged", data, namespace="/hwr")

        # app.usermanager.signout()

    @server.flask_socketio.on("setRaMaster", namespace="/hwr")
    def set_master(data):
        leave_room("observers", namespace="/ui_state")

        return current_user.username

    @server.flask_socketio.on("setRaObserver", namespace="/hwr")
    def set_observer(data):
        name = data.get("name", "")

        if name:
            current_user.nickname = name
            app.usermanager.update_user(current_user)
            #server.emit(
            #    "observerLogin",
            #    current_user.todict(),
            #    include_self=False,
            #    namespace="/hwr",
            #)

        data = {
            "observers": [_u.todict() for _u in app.usermanager.get_observers()],
            "message": "",
            "operator": app.usermanager.get_operator().todict(),
        }

        server.emit("observersChanged", data, namespace="/hwr")
        join_room("observers", namespace="/ui_state")

        return current_user.username

    return bp
