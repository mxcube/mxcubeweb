from flask_socketio import emit
from mxcubeweb.server import Server as server
from mxcubeweb.app import MXCUBEApplication as mxcube

import json


def flush():
    mxcube.UI_STATE = dict()


def init():
    @server.flask_socketio.on("connect", namespace="/ui_state")
    @server.ws_restrict
    def connect():
        pass

    @server.flask_socketio.on("disconnect", namespace="/ui_state")
    def disconnect():
        pass

    @server.flask_socketio.on("ui_state_get", namespace="/ui_state")
    def ui_state_get(k):
        k = k.replace("reduxPersist:", "")
        # print 'ui state GET',k,'returning:',STATE[k]
        return json.dumps(mxcube.UI_STATE[k])

    @server.flask_socketio.on("ui_state_rm", namespace="/ui_state")
    def ui_state_rm(k):
        k = k.replace("reduxPersist:", "")
        # print 'ui state REMOVE',k
        del mxcube.UI_STATE[k]

    @server.flask_socketio.on("ui_state_set", namespace="/ui_state")
    def ui_state_update(key_val):
        key, val = key_val
        mxcube.UI_STATE[key.replace("reduxPersist:", "")] = json.loads(val)

        emit(
            "state_update",
            json.dumps(mxcube.UI_STATE),
            namespace="/ui_state",
            room="observers",
            include_self=False,
        )

    @server.flask_socketio.on("ui_state_getkeys", namespace="/ui_state")
    def ui_state_getkeys(*args):
        return ["reduxPersist:" + k for k in mxcube.UI_STATE.keys()]
