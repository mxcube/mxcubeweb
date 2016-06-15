import logging, json, inspect
from mxcube3 import socketio
from mxcube3 import app as mxcube
import time

@socketio.on('connect', namespace='/hwr')
def connect():
    # this is needed to create the namespace, and the actual connection
    # to the server, but we don't need to do anything more
    pass

collectSignals = ['collectStarted','collectEnded', 'testSignal', 'warning']
collectOscSignals = [ 'collectOscillationStarted', 'collectOscillationFailed', 'collectOscillationFinished']

queueSignals = ['queue_execution_finished', 'queue_paused', 'queue_stopped', 'testSignal', 'warning'] #'centringAllowed',
microdiffSignals = ['centringInvalid','newAutomaticCentringPoint','centringStarted','centringAccepted','centringMoving',\
                    'centringFailed','centringSuccessful','progressMessage','centringSnapshots', 'warning', 'positionChanged', \
                    'phiMotorStateChanged','phiyMotorStateChanged','phizMotorStateChanged', 'sampxMotorStateChanged', \
                    'sampyMotorStateChanged', 'minidiffStateChanged','minidiffPhaseChanged','minidiffSampleIsLoadedChanged',\
                    'zoomMotorPredefinedPositionChanged', 'minidiffTransferModeChanged', 'positionChanged', 'actuatorStateChanged']

okSignals = ['Successful', 'Finished', 'finished','Ended', 'Accepted'] 
failedSignals = ['Failed','Invalid']
progressSignals = ['Started', 'Ready', 'paused', 'stopped', 'Moving', 'progress', 'centringAllowed']
warnSignals = ['warning']

error_signals ={}
logging_signals = {}
samplechanger_signals = {}
queue_signals = {}
beam_signals = {}
moveables_signals ={}

task_signals = { ## missing egyscan, xrf, etc...
    'collectStarted':               'Data collecion has started',
    'collectOscillationStarted':    'Data collecion oscillation has started', 
    'collectOscillationFailed':     'Data collecion oscillacion has failed', 
    'collectOscillationFinished':   'Data collecion oscillacion has finished',
    'collectEnded':                 'Data collecion has finished',
    'warning':                      'Data collection finished with a warning',
    'collect_finished':             'Data collecion has finished'
}

motor_signals = {   
    'positionChanged':              'positionChanged',
    'phiMotorStateChanged':         'phiMotorStateChanged',
    'phiyMotorStateChanged':        'phiyMotorStateChanged',
    'phizMotorStateChanged':        'phizMotorStateChanged',
    'sampxMotorStateChanged':       'sampxMotorStateChanged',
    'sampyMotorStateChanged':       'sampyMotorStateChanged',
    'zoomMotorStateChanged':        'zoomMotorStateChanged',
    'actuatorStateChanged':         'actuatorStateChanged',
    'minidiffStateChanged':         'minidiffStateChanged',
    'minidiffPhaseChanged':         'minidiffPhaseChanged',
    'minidiffTransferModeChanged':  'minidiffTransferModeChanged',
    'minidiffSampleIsLoadedChanged':'minidiffSampleIsLoadedChanged',
    'zoomMotorPredefinedPositionChanged': 'zoomMotorPredefinedPositionChanged',
    'diffractometerMoved':          'diffractometerMoved',
    'stateChanged':                 'stateChanged'
}


def get_signal_result(signal):
    result = 0
    for sig in progressSignals:
        if sig in signal:
            result = 1
    for sig in okSignals:
        if sig in signal:
            result = 2
    for sig in failedSignals:
        if sig in signal:
            result = 3
    for sig in warnSignals:
        if sig in signal:
            result = 4
    return result

def collectOscillationStarted(*args):
    lastQueueNode = mxcube.queue.lastQueueNode
    msg = {'Signal': 'collectOscillationStarted','Message': task_signals['collectOscillationStarted'], 'QueueId':lastQueueNode['id'], 'Sample' :lastQueueNode['sample'] ,'State':get_signal_result('collectOscillationStarted')}
    logging.getLogger('HWR').debug('[TASK CALLBACK]   ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: '+ str(msg))

def collectOscillationFailed(*args):
    lastQueueNode = mxcube.queue.lastQueueNode
    msg = {'Signal': 'collectOscillationFailed','Message': task_signals['collectOscillationFailed'], 'QueueId':lastQueueNode['id'], 'Sample' :lastQueueNode['sample'] ,'State':get_signal_result('collectOscillationFailed')}
    logging.getLogger('HWR').debug('[TASK CALLBACK]   ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: '+ str(msg))

def collectOscillationFinished(*args):
    lastQueueNode = mxcube.queue.lastQueueNode
    msg = {'Signal': 'collectOscillationFinished','Message': task_signals['collectOscillationFinished'], 'QueueId':lastQueueNode['id'], 'Sample' :lastQueueNode['sample'] ,'State':get_signal_result('collectOscillationFinished')}
    logging.getLogger('HWR').debug('[TASK CALLBACK]   ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: '+ str(msg))

def task_event_callback(*args, **kwargs):#, **kwargs):
    #logging.getLogger('HWR').debug('[TASK CALLBACK]')
    #logging.getLogger("HWR").debug(kwargs)
    #logging.getLogger("HWR").debug(args)
    lastQueueNode = mxcube.queue.lastQueueNode
    msg = {'Signal': kwargs['signal'],'Message': task_signals[kwargs['signal']], 'QueueId':lastQueueNode['id'], 'Sample' :lastQueueNode['sample'] ,'State':get_signal_result(kwargs['signal'])}
    logging.getLogger('HWR').debug('[TASK CALLBACK]   ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: '+ str(msg))
    try:
        msg = { "message": sender +':'+signal, "severity": 'INFO', "timestamp":time.asctime(), "logger":'HWR', "stack_trace":'' }
        socketio.emit('log_record', msg, namespace='/logging')
    except Exception:
        logging.getLogger("HWR").error('error sending message: '+  str(msg))


def motor_event_callback(*args, **kwargs):
    #logging.getLogger('HWR').debug('[MOTOR CALLBACK]')
    #logging.getLogger("HWR").debug(kwargs) 
    #logging.getLogger("HWR").debug(args) 
    signal = kwargs['signal']
    sender = str(kwargs['sender'].__class__).split('.')[0]

    motors = ['Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'] 
    #'Kappa', 'Kappa_phi',
    motors_info = {}
    for mot in motors:
        motor_hwobj = mxcube.diffractometer.getObjectByRole(mot.lower())
        if motor_hwobj is not None:
            if mot == 'Zoom':
                pos = motor_hwobj.predefinedPositions[motor_hwobj.getCurrentPositionName()]
                status = "unknown"
            elif mot == 'BackLightSwitch' or mot == 'FrontLightSwitch':
                states = {"in": 1, "out": 0}
                pos = states[motor_hwobj.getActuatorState()]  # {0:"out", 1:"in", True:"in", False:"out"}
                # 'in', 'out'
                status = pos 
            else:
                try:
                    pos = motor_hwobj.getPosition()
                    status = motor_hwobj.getState()
                except Exception:
                    logging.getLogger('HWR').exception('[SAMPLEVIEW] could not get "%s" motor' %mot)
            motors_info[mot] = {'Status': status, 'position': pos}

    aux = {}
    for p in mxcube.diffractometer.savedCentredPos:
            aux.update({p['posId']:p})
    ## sending all motors position/status, and the current centred positions
    msg = {'Signal': signal,'Message': motor_signals[signal], 'Motors':motors_info, 'CentredPositions': aux, 'Data': args[0] if len(args) ==1 else args}
    #logging.getLogger('HWR').debug('[MOTOR CALLBACK]   ' + str(msg))
    try:
        socketio.emit('Motors', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: %s'+str(msg))

    try:
        msg = { "message": sender +':'+signal, "severity": 'INFO', "timestamp":time.asctime(), "logger":'HWR', "stack_trace":'' }
        socketio.emit('log_record', msg, namespace='/logging')
    except Exception:
        logging.getLogger("HWR").error('error sending message: %s'+str(msg))
