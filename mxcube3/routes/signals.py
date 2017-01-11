import logging

from mxcube3 import socketio
from mxcube3 import app as mxcube
from mxcube3.routes import Utils
from mxcube3.routes import qutils
from mxcube3.remote_access import safe_emit
from sample_changer.GenericSampleChanger import SampleChangerState


def last_queue_node():
    node = mxcube.queue.queue_hwobj._current_queue_entries[-1].get_data_model()
    if 'refdc' in node.get_name():  # link to the corresponding char
        parent = node.get_parent()  # same parent as char
        node = parent._children[0]  # but the rfdc children not here @#@#!!!
    return qutils.node_index(node)


collect_signals = ['collectStarted', 'testSignal', 'warning']
collect_osc_signals = ['collectOscillationStarted', 'collectOscillationFailed', 'collectOscillationFinished']
beam_signals = ['beamPosChanged', 'beamInfoChanged']

queueSignals = ['queue_execution_finished', 'queue_paused', 'queue_stopped', 'testSignal', 'warning'] # 'centringAllowed',
microdiffSignals = ['centringInvalid', 'newAutomaticCentringPoint', 'centringStarted','centringAccepted','centringMoving',\
                    'centringFailed', 'centringSuccessful', 'progressMessage', 'centringSnapshots', 'warning', 
                    'minidiffPhaseChanged', 'minidiffSampleIsLoadedChanged',\
                    'zoomMotorPredefinedPositionChanged', 'minidiffTransferModeChanged']

okSignals = ['Successful', 'Finished', 'finished', 'Ended', 'Accepted']
failedSignals = ['Failed', 'Invalid']
progressSignals = ['Started', 'Ready', 'paused', 'stopped',
                   'Moving', 'progress', 'centringAllowed']
warnSignals = ['warning']

error_signals = {}
logging_signals = {}
samplechanger_signals = {}
moveables_signals = {}

task_signals = {  # missing egyscan, xrf, etc...
    'collectStarted':               'Data collection has started',
    'collectOscillationStarted':    'Data collection oscillation has started',
    'collectOscillationFailed':     'Data collection oscillacion has failed',
    'collectOscillationFinished':   'Data collection oscillacion has finished',
    'collectEnded':                 'Data collection has finished',
    'warning':                      'Data collection finished with a warning',
    'collect_finished':             'Data collection has finished'
}

motor_signals = {
    'actuatorStateChanged':         'actuatorStateChanged',
    'minidiffPhaseChanged':         'minidiffPhaseChanged',
    'minidiffTransferModeChanged':  'minidiffTransferModeChanged',
    'minidiffSampleIsLoadedChanged': 'minidiffSampleIsLoadedChanged',
    'zoomMotorPredefinedPositionChanged': 'zoomMotorPredefinedPositionChanged',
}

mach_info_signals = {
    'mach_info_changed':                 'mach_info_changed'
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


def get_signal_progress(signal):
    result = 0
    for sig in progressSignals:
        if sig in signal:
            result = 50
    for sig in okSignals:
        if sig in signal:
            result = 100
    for sig in failedSignals:
        if sig in signal:
            result = 100
    for sig in warnSignals:
        if sig in signal:
            result = 100
    return result


def sc_state_changed(*args):
    new_state = args[0]
    old_state = None

    if len(args) == 2:
        old_state = args[1]

    location = ''

    if mxcube.sample_changer.getLoadedSample():
      location =  mxcube.sample_changer.getLoadedSample().getAddress()

    if location:
        if new_state == SampleChangerState.Moving and old_state == None:
            msg = {'signal': 'loadingSample',
                   'location': location,
                   'message': 'Please wait, operating sample changer'}

            socketio.emit('sc', msg, namespace='/hwr')

        elif new_state == SampleChangerState.Unloading and location:
            msg = {'signal': 'loadingSample',
                   'location': location,
                   'message': 'Please wait, Unloading sample %s' % location}

            socketio.emit('sc', msg, namespace='/hwr')

        elif new_state == SampleChangerState.Ready and old_state == SampleChangerState.Loading:
            msg = {'signal': 'loadedSample',
                   'location': location,
                   'message': 'Please wait, Loaded sample %s' % location}

            socketio.emit('sc', msg, namespace='/hwr')

        elif new_state == SampleChangerState.Ready and old_state == None:
            msg = {'signal': 'loadReady',
                   'location': location}

            socketio.emit('sc', msg, namespace='/hwr')


def centring_started(method, *args):
    usr_msg = 'Using 3-click centring, please click the position on '
    usr_msg += 'the sample you would like to center (three times)'

    msg = {'signal': 'SampleCentringRequest',
           'message': usr_msg}

    socketio.emit('sample_centring', msg, namespace='/hwr')


def queue_execution_started(entry):
    msg = {'Signal': qutils.queue_exec_state(),
           'Message': 'Queue execution started',
           'State': 1}

    safe_emit('queue', msg, namespace='/hwr')


def queue_execution_finished(entry):
    msg = {'Signal': qutils.queue_exec_state(),
           'Message': 'Queue execution stopped',
           'State': 1}

    safe_emit('queue', msg, namespace='/hwr')


def queue_execution_failed(entry):    
    msg = {'Signal': qutils.queue_exec_state(),
           'Message': 'Queue execution stopped',
           'State': 2}

    safe_emit('queue', msg, namespace='/hwr')


def collect_oscillation_started(*args):
    msg = {'Signal': 'collectOscillationStarted',
           'Message': task_signals['collectOscillationStarted'],
           'taskIndex': last_queue_node()['idx'] ,
           'sample': last_queue_node()['sample'],
           'state': get_signal_result('collectOscillationStarted'),
           'progress': 0}

    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_oscillation_failed(owner, status, state, lims_id, osc_id, params=None):
    msg = {'Signal': 'collectOscillationFailed',
           'Message': task_signals['collectOscillationFailed'],
           'taskIndex' : last_queue_node()['idx'] ,
           'sample': last_queue_node()['sample'],
           'limstResultData': mxcube.rest_lims.get_dc(lims_id),
           'state': get_signal_result('collectOscillationFailed'),
           'progress': 100}
    logging.getLogger('HWR').debug('[TASK CALLBACK]   ' + str(msg))
    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_oscillation_finished(owner, status, state, lims_id, osc_id, params):
    qutils.enable_entry(last_queue_node()['queue_id'], False)
    
    msg = {'Signal': 'collectOscillationFinished',
           'Message': task_signals['collectOscillationFinished'],
           'taskIndex': last_queue_node()['idx'] ,
           'sample': last_queue_node()['sample'],
           'limsResultData': mxcube.rest_lims.get_dc(lims_id),
           'state': 2,
           'progress': 100}
    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_ended(owner, success, message):
    state = 2 if success else 3

    msg = {'Signal': 'collectOscillationFinished',
           'Message': message,
           'taskIndex': last_queue_node()['idx'] ,
           'sample': last_queue_node()['sample'],
           'state': state,
           'progress': 100}
    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def task_event_callback(*args, **kwargs):
    logging.getLogger('HWR').debug('[TASK CALLBACK]')
    logging.getLogger("HWR").debug(kwargs)
    logging.getLogger("HWR").debug(args)

    msg = {'Signal': kwargs['signal'],
           'Message': task_signals[kwargs['signal']],
           'taskIndex': last_queue_node()['idx'] ,
           'sample': last_queue_node()['sample'],
           'state': get_signal_result(kwargs['signal']),
           'progress': get_signal_progress(kwargs['signal'])}
    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    try:
        safe_emit('task', msg, namespace='/hwr')
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


def motor_position_callback(motor, pos):
   socketio.emit('motor_position', { 'name': motor, 'position': pos }, namespace='/hwr')

def motor_state_callback(motor, state, sender=None, **kw):
    centred_positions = dict()
    for pos in mxcube.diffractometer.savedCentredPos:
        centred_positions.update({pos['posId']: pos})
    
    if state == 2:
      # READY
      motor_position_callback(motor, sender.getPosition())
        
    socketio.emit('motor_state', { 'name': motor, 'state': state, 'centredPositions': centred_positions }, namespace='/hwr')

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

def mach_info_changed(values):
    try:
        socketio.emit("mach_info_changed", values, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error('error sending message: %s' + str(msg))

