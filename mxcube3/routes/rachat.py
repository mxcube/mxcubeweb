# -*- coding: utf-8 -*-
from flask import session, jsonify, Response, request
from mxcube3 import socketio
from mxcube3 import app as mxcube
from mxcube3.remote_access import observer_name, remote_addr

import datetime

MESSAGES = []


def _append_message(message, sid):
    user =  observer_name()

    if not user:
        user = "*"  + session["loginInfo"]["loginID"]

    data = {"message": message, "sid": sid,
            "user": user, "host":remote_addr(),
            "date": datetime.datetime.now().strftime("%H:%M")}

    MESSAGES.append(data)
    socketio.emit('ra_chat_message', data, namespace='/hwr')


def _get_all_messages():
    return MESSAGES


@mxcube.route("/mxcube/api/v0.1/chat", methods=["POST"])
@mxcube.restrict
def append_message():
    message = request.get_json().get("message", "")
    sid = request.get_json().get("sid", "")

    if message and sid:
        _append_message(message, sid)

    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/chat", methods=["GET"])
@mxcube.restrict
def get_all_mesages():
    return jsonify({"messages": MESSAGES})
