from mxcube3 import socketio

UI_STATE = dict()

@socketio.on('connect', namespace='/ui_state')
def connect():
    pass

@socketio.on('disconnect', namespace='/ui_state')
def disconnect():
    pass

@socketio.on('ui_state_get', namespace='/ui_state')
def ui_state_get(k):
    #print 'ui state GET',k,'returning:',STATE[k]
    return UI_STATE[k]

@socketio.on('ui_state_rm', namespace='/ui_state')
def ui_state_rm(k):
    print 'ui state REMOVE',k
    del UI_STATE[k]

@socketio.on('ui_state_set', namespace='/ui_state')
def ui_state_update(key_val):
    print 'ui state SET', key_val
    key, val = key_val
    UI_STATE[key]=val

@socketio.on('ui_state_getkeys', namespace='/ui_state')
def ui_state_getkeys(*args):
    return UI_STATE.keys()

