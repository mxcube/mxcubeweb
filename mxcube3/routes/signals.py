import logging
import json
import inspect
import time

from mxcube3 import socketio
from mxcube3 import app as mxcube
from mxcube3.routes import Utils


@socketio.on('connect', namespace='/hwr')
def connect():
    # this is needed to create the namespace, and the actual connection
    # to the server, but we don't need to do anything more
    pass

collect_signals = ['collectStarted', 'collectEnded', 'testSignal', 'warning']
collect_osc_signals = ['collectOscillationStarted', 'collectOscillationFailed', 'collectOscillationFinished']
beam_signals = ['beamPosChanged', 'beamInfoChanged']

queueSignals = ['queue_execution_finished', 'queue_paused', 'queue_stopped', 'testSignal', 'warning'] # 'centringAllowed',
microdiffSignals = ['centringInvalid', 'newAutomaticCentringPoint', 'centringStarted','centringAccepted','centringMoving',\
                    'centringFailed', 'centringSuccessful', 'progressMessage', 'centringSnapshots', 'warning', 'positionChanged', \
                    'phiMotorStateChanged', 'phiyMotorStateChanged', 'phizMotorStateChanged', 'sampxMotorStateChanged', \
                    'sampyMotorStateChanged', 'minidiffStateChanged', 'minidiffPhaseChanged', 'minidiffSampleIsLoadedChanged',\
                    'zoomMotorPredefinedPositionChanged', 'minidiffTransferModeChanged', 'positionChanged', 'actuatorStateChanged']

okSignals = ['Successful', 'Finished', 'finished', 'Ended', 'Accepted']
failedSignals = ['Failed', 'Invalid']
progressSignals = ['Started', 'Ready', 'paused', 'stopped',
                   'Moving', 'progress', 'centringAllowed']
warnSignals = ['warning']

error_signals = {}
logging_signals = {}
samplechanger_signals = {}
queue_signals = {}
beam_signals = {}
moveables_signals = {}

task_signals = {  # missing egyscan, xrf, etc...
    'collectStarted':               'Data collecion has started',
    'collectOscillationStarted':    'Data collecion oscillation has started',
    'collectOscillationFailed':     'Data collecion oscillacion has failed',
    'collectOscillationFinished':   'Data collecion oscillacion has finished',
    'collectEnded':                 'Data collecion has finished',
    'warning':                      'Data collection finished with a warning',
    'collect_finished':             'Data collecion has finished'
}

motor_signals = {
    'phiMotorStateChanged':         'phiMotorStateChanged',
    'phiyMotorStateChanged':        'phiyMotorStateChanged',
    'phizMotorStateChanged':        'phizMotorStateChanged',
    'sampxMotorStateChanged':       'sampxMotorStateChanged',
    'sampyMotorStateChanged':       'sampyMotorStateChanged',
    'zoomMotorStateChanged':        'zoomMotorStateChanged',
    'actuatorStateChanged':         'actuatorStateChanged',
    'minidiffPhaseChanged':         'minidiffPhaseChanged',
    'minidiffTransferModeChanged':  'minidiffTransferModeChanged',
    'minidiffSampleIsLoadedChanged': 'minidiffSampleIsLoadedChanged',
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


def collect_oscillation_started(*args):
    last_queue_node = mxcube.queue.last_queue_node
    msg = {'Signal': 'collectOscillationStarted',
           'Message': task_signals['collectOscillationStarted'],
           'QueueId': last_queue_node['id'],
           'Sample': last_queue_node['sample'],
           'State': get_signal_result('collectOscillationStarted')}

    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_oscillation_failed(*args):
    last_queue_node = mxcube.queue.last_queue_node
    msg = {'Signal': 'collectOscillationFailed',
           'Message': task_signals['collectOscillationFailed'],
           'QueueId': last_queue_node['id'],
           'Sample': last_queue_node['sample'],
           'State': get_signal_result('collectOscillationFailed')}
    logging.getLogger('HWR').debug('[TASK CALLBACK]   ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_oscillation_finished(*args):
    last_queue_node = mxcube.queue.last_queue_node
    msg = {'Signal': 'collectOscillationFinished',
           'Message': task_signals['collectOscillationFinished'],
           'QueueId': last_queue_node['id'],
           'Sample': last_queue_node['sample'],
           'State': get_signal_result('collectOscillationFinished')}
    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def task_event_callback(*args, **kwargs):  # , **kwargs):
    # logging.getLogger('HWR').debug('[TASK CALLBACK]')
    # logging.getLogger("HWR").debug(kwargs)
    # logging.getLogger("HWR").debug(args)
    signal = kwargs['signal']
    sender = str(kwargs['sender'].__class__).split('.')[0]
    last_queue_node = mxcube.queue.last_queue_node
    msg = {'Signal': kwargs['signal'],
           'Message': task_signals[kwargs['signal']],
           'QueueId': last_queue_node['id'],
           'Sample': last_queue_node['sample'],
           'State': get_signal_result(kwargs['signal'])}
    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    try:
        socketio.emit('Task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))
    # try:
    #     msg = {"message": sender + ':' + signal,
    #            "severity": 'INFO',
    #            "timestamp": time.asctime(),
    #            "logger": 'HWR',
    #            "stack_trace": ''}
    #     socketio.emit('log_record', msg, namespace='/logging')
    # except Exception:
    #     logging.getLogger("HWR").error('error sending message: ' + str(msg))


def motor_event_callback(*args, **kwargs):
    # logging.getLogger('HWR').debug('[MOTOR CALLBACK]')
    # logging.getLogger("HWR").debug(kwargs)
    # logging.getLogger("HWR").debug(args)
    signal = kwargs['signal']
    sender = str(kwargs['sender'].__class__).split('.')[0]

    motors_info = Utils.get_centring_motors_info() 

    motors_info.update(Utils.get_light_state_and_intensity())

    motors_info['pixelsPerMm'] = mxcube.diffractometer.get_pixels_per_mm()

    aux = {}
    for pos in mxcube.diffractometer.savedCentredPos:
            aux.update({pos['posId']: pos})

    #  sending all motors position/status, and the current centred positions
    msg = {'Signal': signal,
           'Message': signal,
           'Motors': motors_info,
           'CentredPositions': aux,
           'Data': args[0] if len(args) == 1 else args}
    # logging.getLogger('HWR').debug('[MOTOR CALLBACK]   ' + str(msg))

    try:
        socketio.emit('Motors', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: %s' + str(msg))

    # try:
    #     msg = {"message": sender + ':' + signal,
    #            "severity": 'INFO',
    #            "timestamp": time.asctime(),
    #            "logger": 'HWR',
    #            "stack_trace": ''}
    #     socketio.emit('log_record', msg, namespace='/logging')
    # except Exception:
    #     logging.getLogger("HWR").error('error sending message: %s' + str(msg))


def beam_changed(*args, **kwargs):
    ret = {}
    signal = kwargs['signal']
    beam_info = mxcube.beamline.getObjectByRole("beam_info")

    if beam_info is None:
        logging.getLogger('HWR').error("beamInfo is not defined")
        return Response(status=409)

    try:
        beam_info_dict = beam_info.get_beam_info()
    except Exception:
        beam_info_dict = dict()

    ret.update({'position': beam_info.get_beam_position(),
                'shape': beam_info_dict.get("shape"),
                'size_x': beam_info_dict.get("size_x"),
                'size_y': beam_info_dict.get("size_y")
                })

    msg = {'Signal': signal, 'Message': signal, 'Data': ret}
    # logging.getLogger('HWR').debug('[MOTOR CALLBACK]   ' + str(msg))
    try:
        socketio.emit('beam_changed', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: %s' + str(msg))
