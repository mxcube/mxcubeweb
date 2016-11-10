from flask import request, session
from mxcube3 import socketio
from collections import deque

MASTER = None
MASTER_ROOM = None
PENDING_EVENTS = deque()

def set_master(master_sid):
    global MASTER
    MASTER = master_sid

def is_master(sid):
    return MASTER == sid

def flush():
    global MASTER
    global PENDING_EVENTS
    MASTER = None
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
    kw['room'] = MASTER_ROOM
    socketio.emit(event, json_dict, **kw)

def safe_emit(event, json_dict, **kwargs):
    PENDING_EVENTS.append((id(json_dict), event, json_dict, kwargs))
    if len(PENDING_EVENTS) == 1:
        emit_pending_events()

@socketio.on('connect', namespace='/hwr')
def connect():
    global MASTER_ROOM
    if is_master(session.sid):
        MASTER_ROOM = request.sid
        emit_pending_events() 

@socketio.on('setRaMaster', namespace='/hwr')
def set_master_id():
    global MASTER_ROOM
    MASTER_ROOM = request.sid
    emit_pending_events()
 
