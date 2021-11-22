# -*- coding: utf-8 -*-
import gevent
import logging
import json

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
                user = app.usermanager.get_user_by_sid(sid)

                # Pass control to user if still waiting
                if user.get("requestsControl"):
                    toggle_operator(sid, "Timeout expired, you have control")

        data = request.get_json()

        # Is someone already asking for control
        for observer in app.usermanager.get_observers():
            if observer["requestsControl"] and observer["host"] != remote_addr():
                msg = "Another user is already asking for control"
                return make_response(msg, 409)

        # user = app.usermanager.get_user_by_sid(session.sid)

        # user["name"] = data["name"]
        # user["requestsControl"] = data["control"]
        # user["message"] = data["message"]

        current_user.requests_control = data["control"]
        server.user_datastore.commit()

        observers = app.usermanager.get_observers()
        gevent.spawn(handle_timeout_gives_control, session.sid, timeout=10)

        server.emit("observersChanged", observers, namespace="/hwr")

        return make_response("", 200)

    @bp.route("/take_control", methods=["POST"])
    @server.restrict
    def take_control():
        """
        """
        import flask
        sid = flask.session["sid"]

        # Already master do nothing
        if app.usermanager.is_operator():
            return make_response("", 200)

        # Not inhouse user so not allowed to take control by force,
        # return error code
        if not "staff" in current_user.roles:
            return make_response("", 409)

        toggle_operator(sid, "You were given control")

        return make_response("", 200)

    @bp.route("/give_control", methods=["POST"])
    @server.restrict
    def give_control():
        """
        """
        sid = request.get_json().get("sid")
        toggle_operator(sid, "You were given control")

        return make_response("", 200)

    def toggle_operator(new_op_sid, message):
        current_op = app.usermanager.get_operator()

        new_op = app.usermanager.get_user_by_sid(new_op_sid)
        app.usermanager.set_operator(new_op["sid"])
        new_op["message"] = message

        observers = app.usermanager.get_observers()

        # Append the new data path so that it can be updated on the client
        new_op["rootPath"] = HWR.beamline.session.get_base_image_directory()

        # Current op might have logged out, while this is happening
        if current_op:
            current_op["rootPath"] = HWR.beamline.session.get_base_image_directory()
            current_op["message"] = message
            server.emit(
                "setObserver",
                current_op,
                room=current_op["socketio_sid"],
                namespace="/hwr",
            )

        server.emit("observersChanged", observers, namespace="/hwr")
        server.emit("setMaster", new_op, room=new_op["socketio_sid"], namespace="/hwr")

    def remain_observer(observer_sid, message):
        observer = app.usermanager.get_user_by_sid(observer_sid)
        observer["message"] = message

        server.emit(
            "setObserver", observer, room=observer["socketio_sid"], namespace="/hwr"
        )

    @bp.route("/", methods=["GET"])
    @server.restrict
    def observers():
        """
        """
        data = {
            "observers": [],  # app.usermanager.get_observers(),
            "sid": current_user.username,
            "master": app.usermanager.is_operator(),
            "observerName": current_user.name,
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
            if o["requestsControl"]:
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
            remain_observer(new_op["sid"], data["message"])
        else:
            toggle_operator(new_op["sid"], data["message"])

        new_op["requestsControl"] = False

        return make_response("", 200)

    @bp.route("/chat", methods=["POST"])
    def append_message():
        message = request.get_json().get("message", "")
        sid = request.get_json().get("sid", "")

        if message and sid:
            app.chat.append_message(message, sid)

        return Response(status=200)

    @bp.route("/chat", methods=["GET"])
    @server.restrict
    def get_all_mesages():
        return jsonify({"messages": app.chat.get_all_messages()})

    @server.flask_socketio.on("connect", namespace="/hwr")
    @server.ws_restrict
    def connect():
        global DISCONNECT_HANDLED
        # user = app.usermanager.get_user_by_sid(session.sid)

        # Make sure user is logged, session may have been closed i.e by timeout
        # if user:
        #    user["socketio_sid"] = request.sid

        # (Note: User is logged in if operator)
        if app.usermanager.is_operator():
            if not HWR.beamline.queue_manager.is_executing() and not DISCONNECT_HANDLED:
                DISCONNECT_HANDLED = True
                server.emit("resumeQueueDialog", namespace="/hwr")
                msg = "Client reconnected, Queue was previously stopped, asking "
                msg += "client for action"
                logging.getLogger("HWR").info(msg)

    @server.flask_socketio.on("disconnect", namespace="/hwr")
    def disconnect():
        global DISCONNECT_HANDLED
        if app.usermanager.is_operator() and HWR.beamline.queue_manager.is_executing():

            DISCONNECT_HANDLED = False
            logging.getLogger("HWR").info("Client disconnected")

    @server.flask_socketio.on("setRaMaster", namespace="/hwr")
    def set_master(data):
        leave_room("observers", namespace="/ui_state")

        return current_user.username

    @server.flask_socketio.on("setRaObserver", namespace="/hwr")
    def set_observer(data):
        name = data.get("name", "")
        observers = []  # app.usermanager.get_observers()
        observer = {}

        if observer and name:
            observer["name"] = current_user.name
            server.emit("observerLogin", observer, include_self=False, namespace="/hwr")

        server.emit("observersChanged", observers, namespace="/hwr")
        join_room("observers", namespace="/ui_state")

        return current_user.username

    return bp
