import datetime
import socket
import functools

import flask
import flask_socketio

from flask_security import current_user, login_required

def remote_addr():
    hdr = flask.request.headers.get("x-forwarded-for", flask.request.remote_addr)

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

def valid_login_only(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            return flask.Response(status=404)
        else:
            return f(*args, **kwargs)

    return wrapped


def require_control(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if current_user.is_authenticated and not current_user.in_control:
            return flask.Response(status=401)
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


def send_feedback():
    sender_data = flask.request.get_json()
    sender_data["LOGGED_IN_USER"] = current_user.name

    utils.send_feedback(sender_data)
