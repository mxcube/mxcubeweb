# -*- coding: utf-8 -*-
from flask import session, jsonify, Response, request
from mxcube3 import socketio
from mxcube3 import app as mxcube
from mxcube3.remote_access import observer_name, remote_addr

import datetime

MESSAGES = []


def _append_message(message, sid):
    data = {"message": message, "sid": sid,
            "user": observer_name(), "host":remote_addr(),
            "date": datetime.datetime.now().strftime("%H:%M")}

    MESSAGES.append(data)
    socketio.emit('ra_chat_message', data, namespace='/hwr')


def _get_all_messages():
    print("GETTING ALL MESSAGES %s" % str(MESSAGES))
    return MESSAGES


@mxcube.route("/mxcube/api/v0.1/chat", methods=["POST"])
def append_message():
    message = request.get_json().get("message", "")
    sid = request.get_json().get("sid", "")

    if message and sid:
        _append_message(message, sid)

    print("ADDED MESSAGE %s" % message)

    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/chat", methods=["GET"])
def get_all_mesages():
    return jsonify({"messages": MESSAGES})
