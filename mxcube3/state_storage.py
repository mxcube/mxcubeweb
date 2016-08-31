from flask import session, make_response
from mxcube3 import app as mxcube
from mxcube3 import socketio

def save_session():
    session.modified = True
    mxcube.save_session(session, make_response('dummy'))
    
@socketio.on('connect', namespace='/ui_state')
def connect():
     print '>'*50, 'CONNECT',session
     
     if session.get('uiState') is None:
         session['uiState'] = dict()

@socketio.on('disconnect', namespace='/ui_state')
def disconnect():
    print '-'*50, 'DISCONNECTED'

@socketio.on('ui_state_get', namespace='/ui_state')
def ui_state_get(k):
    #print 'ui state GET',k,'returning:',STATE[k]
    return session['uiState'][k]

@socketio.on('ui_state_rm', namespace='/ui_state')
def ui_state_rm(k):
    print 'ui state REMOVE',k
    s = session['uiState']
    del s[k]
    session['uiState'] = s
    # flask-socketio do not modify session automatically
    # within websocket listeners, so let's do it ourselves
    save_session()

@socketio.on('ui_state_set', namespace='/ui_state')
def ui_state_update(key_val):
    print 'ui state SET', key_val
    key, val = key_val
    session['uiState'][key]=val
    # flask-socketio do not modify session automatically
    # within websocket listeners, so let's do it ourselves
    save_session()

@socketio.on('ui_state_getkeys', namespace='/ui_state')
def ui_state_getkeys(*args):
    print 'ui state GET KEYS ', session['uiState'].keys()
    return session['uiState'].keys()

