import gevent
from flask import (
    Blueprint,
    Response,
    copy_current_request_context,
    jsonify,
    make_response,
    request,
)
from flask_login import current_user

DISCONNECT_HANDLED = True


# Disabling C901 function is too complex (19)
def init_route(app, server, url_prefix):  # noqa: C901
    bp = Blueprint("remote_access", __name__, url_prefix=url_prefix)

    @bp.route("/request_control", methods=["POST"])
    @server.restrict
    def request_control():
        """ """

        @copy_current_request_context
        def handle_timeout_gives_control(sid, timeout=30):
            gevent.sleep(timeout)

            if app.TIMEOUT_GIVES_CONTROL and current_user.requests_control:
                # Pass control to user if still waiting
                toggle_operator(
                    current_user.username,
                    "Timeout expired, you have control",
                )

        # Is someone already asking for control
        for observer in app.usermanager.get_observers():
            if observer.requests_control and observer.username != current_user.username:
                msg = "Another user is already asking for control"
                return make_response(msg, 409)

        data = request.get_json()
        current_user.requests_control = True
        current_user.requests_control_msg = data["message"]
        app.usermanager.update_user(current_user)

        server.emit("observersChanged", namespace="/hwr")

        gevent.spawn(
            handle_timeout_gives_control,
            current_user.username,
            timeout=10,
        )

        return make_response("", 200)

    @bp.route("/cancel_request", methods=["POST"])
    @server.restrict
    def cancel_request():
        """Cancel request for control"""
        current_user.requests_control = False
        current_user.requests_control_msg = None
        app.usermanager.update_user(current_user)

        server.emit("observersChanged", namespace="/hwr")

        return make_response("", 200)

    @bp.route("/take_control", methods=["POST"])
    @server.restrict
    def take_control():
        """ """
        # Already master do nothing
        if app.usermanager.is_operator():
            return make_response("", 200)

        toggle_operator(current_user.username, "You were given control")

        return make_response("", 200)

    @bp.route("/give_control", methods=["POST"])
    @server.restrict
    def give_control():
        """ """
        username = request.get_json().get("username")
        toggle_operator(username, "You were given control")

        return make_response("", 200)

    @bp.route("/update_user_nickname", methods=["POST"])
    @server.restrict
    def update_user_nickname():
        """ """
        name = request.get_json().get("name")
        current_user.nickname = name
        app.usermanager.update_user(current_user)

        server.emit(
            "userChanged", room=current_user.socketio_session_id, namespace="/hwr"
        )
        server.emit("observersChanged", namespace="/hwr")

        return make_response("", 200)

    @bp.route("/logout_user", methods=["POST"])
    @server.restrict
    def logout_user():
        """ """
        username = request.get_json().get("username")
        app.usermanager.force_signout_user(username)
        return make_response("", 200)

    def toggle_operator(username, message):
        oldop = app.usermanager.get_operator()
        newop = app.usermanager.set_operator(username)

        oldop.requests_control = False
        oldop.requests_control_msg = None
        app.usermanager.update_user(oldop)

        newop.requests_control = False
        newop.requests_control_msg = None
        app.usermanager.update_user(newop)

        server.emit("userChanged", room=oldop.socketio_session_id, namespace="/hwr")
        server.emit(
            "userChanged", message, room=newop.socketio_session_id, namespace="/hwr"
        )
        server.emit("observersChanged", namespace="/hwr")

    @bp.route("/", methods=["GET"])
    @server.restrict
    def rasettings():
        """ """
        data = {
            "observers": [_u.todict() for _u in app.usermanager.get_observers()],
            "allowRemote": app.ALLOW_REMOTE,
            "timeoutGivesControl": app.TIMEOUT_GIVES_CONTROL,
        }

        return jsonify(data=data)

    @bp.route("/allow_remote", methods=["POST"])
    @server.restrict
    def allow_remote():
        """ """
        allow = request.get_json().get("allow")

        if app.ALLOW_REMOTE and not allow:
            server.emit("forceSignoutObservers", {}, namespace="/hwr")

        app.ALLOW_REMOTE = allow

        return Response(status=200)

    @bp.route("/timeout_gives_control", methods=["POST"])
    @server.restrict
    def timeout_gives_control():
        """ """
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
        """ """
        data = request.get_json()
        new_op = observer_requesting_control()

        if data["giveControl"]:
            # Request approved
            toggle_operator(new_op.username, data["message"])
        else:
            # Request denied
            new_op.requests_control = False
            new_op.requests_control_msg = None
            app.usermanager.update_user(new_op)
            server.emit(
                "userChanged",
                data["message"],
                room=new_op.socketio_session_id,
                namespace="/hwr",
            )
            server.emit("observersChanged", namespace="/hwr")

        return make_response("", 200)

    @bp.route("/chat", methods=["POST"])
    def append_message():
        message = request.get_json().get("message", "")
        username = request.get_json().get("username", "")

        if message and username:
            app.chat.append_message(message, current_user)

        return Response(status=200)

    @bp.route("/chat", methods=["GET"])
    @server.restrict
    def get_all_mesages():
        return jsonify({"messages": app.chat.get_all_messages()})

    @bp.route("/chat/set_all_read", methods=["POST"])
    @server.restrict
    def set_all_messages_read():
        app.chat.set_all_messages_read()
        return Response(status=200)

    @server.flask_socketio.on("connect", namespace="/hwr")
    @server.ws_restrict
    def connect():
        current_user.socketio_session_id = request.sid
        app.usermanager.update_user(current_user)

    @server.flask_socketio.on("disconnect", namespace="/hwr")
    def disconnect():
        if current_user.is_anonymous:
            return

        current_user.socketio_session_id = None
        current_user.socketio_session_id = request.sid

    return bp
