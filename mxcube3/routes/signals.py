import logging

import queue_model_objects_v1 as qmo
import queue_entry as qe
import json

from mxcube3 import socketio
from mxcube3 import app as mxcube
from mxcube3.routes import Utils
from mxcube3.routes import qutils
from mxcube3.routes import scutils
from mxcube3.routes import limsutils
from mxcube3.routes.loginutils import safe_emit

from sample_changer.GenericSampleChanger import SampleChangerState
from sample_changer.Container import Pin
from sample_changer.GenericSampleChanger import Sample
from mxcube3.ho_mediators.beamline_setup import BeamlineSetupMediator

from qutils import READY, RUNNING, FAILED, COLLECTED, WARNING, UNCOLLECTED, queue_to_dict
from queue_entry import CENTRING_METHOD
from mxcube3.routes.transportutils import to_camel, from_camel


def last_queue_node():
    node = mxcube.queue.queue_hwobj._current_queue_entries[-1].get_data_model()

    # Reference collections are orphans, the node we want is the
    # characterisation not the reference collection itself
    if 'refdc' in node.get_name():
        parent = node.get_parent()
        node = parent._children[0]

    res = qutils.node_index(node)
    res["node"] = node

    return res


beam_signals = ['beamPosChanged', 'beamInfoChanged']

centringSignals = ['centringInvalid', 'newAutomaticCentringPoint', 'centringStarted',
                   'centringAccepted','centringMoving', 'centringFailed', 'centringSuccessful',
                   'centringSnapshots']

task_signals = {  # missing egyscan, xrf, etc...
    'collectStarted':               'Data collection has started',
    'collectOscillationStarted':    'Data collection oscillation has started',
    'collectOscillationFailed':     'Data collection oscillacion has failed',
    'collectOscillationFinished':   'Data collection oscillacion has finished',
    'collectEnded':                 'Data collection has finished',
    'warning':                      'Data collection finished with a warning',
    'collect_finished':             'Data collection has finished',
    'collectImageTaken':            'Image acquired'
}

motor_signals = {
    'actuatorStateChanged':         'actuatorStateChanged',
    'minidiffPhaseChanged':         'minidiffPhaseChanged',
    'minidiffTransferModeChanged':  'minidiffTransferModeChanged',
    'minidiffSampleIsLoadedChanged': 'minidiffSampleIsLoadedChanged',
    'zoomMotorPredefinedPositionChanged': 'zoomMotorPredefinedPositionChanged',
}


def handle_auto_mount_next(entry):
    model = entry.get_data_model()

    if isinstance(model.get_parent(), qmo.TaskGroup):
        tgroup = model.get_parent()
        auto_mount = qutils.get_auto_mount_sample()
        tgroup = entry.get_data_model()
        tgroup_list = entry.get_data_model().get_parent().get_children()

        try:
            last_gentry = tgroup_list.index(tgroup) == (len(tgroup_list) - 1)
        except ValueError:
            last_gentry = None

        if not auto_mount and last_gentry:
            msg = "Not mounting next sample automatically (Auto mount next)"
            logging.getLogger('user_level_log').info(msg)

def diffractometer_phase_changed(*args):
    data = {'msg': 'Diffractometer phase changed',
           'phase': args
          }
    logging.getLogger('user_level_log').info('Diffractometer phase changed to %s' %args)
    socketio.emit('diff_phase_changed', data, namespace='/hwr')

def sc_state_changed(*args):
    new_state = args[0]
    old_state = None

    if len(args) == 2:
        old_state = args[1]

    location, sc_location, msg = '', '',  None
    loaded_sample = mxcube.sample_changer.getLoadedSample()

    # Handle inconsistent API getLoadedSample sometimes returns a sampleID
    # and other times an object.
    if isinstance(loaded_sample, str):
        if not 'None' in loaded_sample:
            parts = map(int, loaded_sample.split(':'))
            sc_location = ":".join(["%s" % parts[0], '%0.2d' % parts[1]])
    elif loaded_sample:
        sc_location = loaded_sample.getAddress()

    known_location = scutils.get_current_sample().get('sampleID', '')
    location = known_location if known_location else sc_location

    if new_state == SampleChangerState.Moving:
        msg = {'signal': 'operatingSampleChanger',
               'location': '',
               'message': 'Please wait, operating sample changer'}

    elif new_state in [SampleChangerState.Loading, SampleChangerState.Unloading]:
        if new_state == SampleChangerState.Loading:
            location = scutils.get_sample_to_be_mounted()
            message = 'Please wait, Loading sample %s' % location
            signal = 'loadingSample'

        elif new_state == SampleChangerState.Unloading:
            signal = 'unLoadingSample'
            message = 'Please wait, Unloading sample'
            scutils.set_current_sample(None)

        msg = {'signal': signal,
               'location': location,
               'message': message}
    
    if msg:
        logging.getLogger("HWR").info('emitting sc state changed: ' + str(msg))
        socketio.emit('sc', msg, namespace='/hwr')
   
    # emit also brut sample changer state for those interested
    state_str = SampleChangerState.STATE_DESC.get(new_state, "Unknown").upper()
    if new_state == SampleChangerState.Ready:
        msg = {'signal': 'loadReady',
               'location': location,
               'message': 'Sample changer ready'}
        socketio.emit('sc', msg, namespace='/hwr')

    socketio.emit('sc_state', state_str, namespace='/hwr')

def loaded_sample_changed(sample):
    # If sample is a "No sample loaded value" None or ''
    if sample in [None, '']:
        msg = {'signal': 'loadReady', 'location': ''}
        socketio.emit('sc', msg, namespace='/hwr')
        socketio.emit("loaded_sample_changed", {'address': '', 'barcode': ''}, namespace="/hwr")
    
    # If sample is not Pin, Sample pin just return
    if not (isinstance(sample, Pin) or isinstance(sample, Sample)):
        return

    if sample is not None:
        address = sample.getAddress()
        barcode = sample.getID()
    else:
        address = ''
        barcode = ''

    logging.getLogger("HWR").info('loaded sample changed now is: ' + address)
 
    try:
        # recreate the dict with the sample info
        q = queue_to_dict()
        sampleID = sample.getAddress()
        sample_data = q.get(sampleID, {})
    
        scutils.set_current_sample(sample_data)
        msg = {'signal': 'loadReady', 'location': address}
        socketio.emit('sc', msg, namespace='/hwr')
        socketio.emit("loaded_sample_changed", {'address': address, 'barcode': barcode}, namespace="/hwr")
    except Exception, msg:
        logging.getLogger("HWR").error('error setting loaded sample: %s' + str(msg))

def set_current_sample(sample):
    if not sample:
        sample = {"sampleID": ''}

    socketio.emit("set_current_sample", sample , namespace="/hwr")

def sc_contents_update():
    socketio.emit("sc_contents_update")

def sc_maintenance_update(state_list, cmd_state, message):
    try:
        socketio.emit("sc_maintenance_update", {'state': json.dumps(state_list), 'commands_state': json.dumps(cmd_state), 'message': message}, namespace="/hwr")
    except Exception,msg:
        logging.getLogger("HWR").error('error sending message: %s' + str(msg))

def centring_started(method, *args):
    msg = {'method': method}

    if method in ['Computer automatic']:
        msg = {'method': CENTRING_METHOD.LOOP}
    elif method in ['Manual 3-click' ]:
        msg = {'method': CENTRING_METHOD.MANUAL}

    socketio.emit('sample_centring', msg, namespace='/hwr')


def get_task_state(entry):
    node_id = entry.get_data_model()._node_id
    _, state = qutils.get_node_state(node_id)
    node_index = qutils.node_index(entry.get_data_model())
    lims_id = mxcube.NODE_ID_TO_LIMS_ID.get(node_id, 'null')

    try:
        limsres = mxcube.rest_lims.get_dc(lims_id)
    except:
        limsres = {}

    try:
        limsres["limsTaskLink"] = limsutils.get_dc_link(lims_id)
    except Exception:
        limsres["limsTaskLink"] = "#"
        msg = "Could not get lims link for collection with id: %s" % lims_id
        logging.getLogger("HWR").error(msg)

    msg = {'Signal': '',
           'Message': '',
           'taskIndex': node_index['idx'],
           'queueID': node_id,
           'sample': node_index['sample'],
           'limsResultData': limsres,
           'state': state,
           'progress': 1}

    return msg


def update_task_result(entry):
    node_index = qutils.node_index(entry.get_data_model())
    node_id = entry.get_data_model()._node_id
    lims_id = mxcube.NODE_ID_TO_LIMS_ID.get(node_id, 'null')

    try:
        limsres = mxcube.rest_lims.get_dc(lims_id)
    except:
        limsres = {}

    try:
        limsres["limsTaskLink"] = limsutils.get_dc_link(lims_id)
    except Exception:
        limsres["limsTaskLink"] = "#"
        msg = "Could not get lims link for collection with id: %s" % lims_id
        logging.getLogger("HWR").error(msg)

    msg = { 'sample': node_index['sample'],
            'taskIndex': node_index['idx'],
            'limsResultData': limsres }

    socketio.emit('update_task_lims_data', msg, namespace='/hwr')


def queue_execution_entry_finished(entry):
    handle_auto_mount_next(entry)

    if not qutils.is_interleaved(entry.get_data_model()):
        safe_emit('task', get_task_state(entry), namespace='/hwr')

    if isinstance(entry, qe.SampleQueueEntry):
        msg = {'Signal': 'DisableSample', 'sampleID': entry.get_data_model().loc_str}
        safe_emit('queue', msg, namespace='/hwr')


def queue_execution_started(entry, queue_state=None):
    state = queue_state if queue_state else qutils.queue_exec_state()
    msg = {'Signal': state, 'Message': 'Queue execution started'}

    safe_emit('queue', msg, namespace='/hwr')


def queue_execution_finished(entry, queue_state=None):
    state = queue_state if queue_state else qutils.queue_exec_state()
    msg = {'Signal': state, 'Message': 'Queue execution stopped'}

    qutils.enable_sample_entries(mxcube.TEMP_DISABLED, True)
    mxcube.TEMP_DISABLED = []

    safe_emit('queue', msg, namespace='/hwr')


def queue_execution_stopped(*args):
    msg = {'Signal': 'QueueStopped', 'Message': 'Queue execution stopped'}

    safe_emit('queue', msg, namespace='/hwr')


def queue_execution_paused(state):
    if state:
        msg = {'Signal': 'QueuePaused', 'Message': 'Queue execution paused'}
    else:
        msg = {'Signal': 'QueueRunning', 'Message': 'Queue execution paused'}
    
    safe_emit('queue', msg, namespace='/hwr')


def queue_execution_failed(entry):
    msg = {'Signal': qutils.queue_exec_state(),
           'Message': 'Queue execution stopped'}

    safe_emit('queue', msg, namespace='/hwr')


def collect_oscillation_started(*args):
    node = last_queue_node()

    if not qutils.is_interleaved(node["node"]):
        msg = {'Signal': 'collectOscillationStarted',
               'Message': task_signals['collectOscillationStarted'],
               'taskIndex': node['idx'],
               'queueID': node['queue_id'],
               'sample': node['sample'],
               'state': RUNNING,
               'progress': 0}

        logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))

        try:
            safe_emit('task', msg, namespace='/hwr')
        except Exception:
            logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_image_taken(frame):
    node = last_queue_node()

    if not qutils.is_interleaved(node["node"]):
        progress = qutils.get_task_progress(last_queue_node()['node'], frame)

        msg = {'Signal': 'collectImageTaken',
               'Message': task_signals['collectImageTaken'],
               'taskIndex': node['idx'],
               'queueID': node['queue_id'],
               'sample': node['sample'],
               'state': RUNNING if progress < 1 else COLLECTED,
               'progress': progress}
        try:
            _emit_progress(msg)
        except Exception:
            logging.getLogger("HWR").error('error sending message: ' + str(msg))


@Utils.RateLimited(0.5)
def _emit_progress(msg):
    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
    safe_emit('task', msg, namespace='/hwr')


def collect_oscillation_failed(owner=None, status=FAILED, state=None,
                               lims_id='', osc_id=None, params=None):
    node = last_queue_node()

    mxcube.NODE_ID_TO_LIMS_ID[node['queue_id']] = lims_id

    if not qutils.is_interleaved(node["node"]):
        try:
            limsres = mxcube.rest_lims.get_dc(lims_id)
        except:
            limsres = {}

        msg = {'Signal': 'collectOscillationFailed',
               'Message': task_signals['collectOscillationFailed'],
               'taskIndex': node['idx'],
               'queueID': node['queue_id'],
               'sample': node['sample'],
               'state': FAILED,
               'progress': 0}

        logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))
        
        try:
            safe_emit('task', msg, namespace='/hwr')
        except Exception:
            logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_oscillation_finished(owner, status, state, lims_id, osc_id, params):
    node = last_queue_node()
    mxcube.NODE_ID_TO_LIMS_ID[node['queue_id']] = lims_id

    if not qutils.is_interleaved(node["node"]):
        qutils.enable_entry(node['queue_id'], False)

        msg = {'Signal': 'collectOscillationFinished',
               'Message': task_signals['collectOscillationFinished'],
               'taskIndex': node['idx'],
               'queueID': node['queue_id'],
               'sample': node['sample'],
               'state': COLLECTED,
               'progress': 1}

        logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))

        try:
            safe_emit('task', msg, namespace='/hwr')
        except Exception:
            logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_ended(owner, success, message):
    node = last_queue_node()

    if not qutils.is_interleaved(node["node"]):
        state = COLLECTED if success else WARNING

        msg = {'Signal': 'collectOscillationFinished',
               'Message': message,
               'taskIndex': node['idx'],
               'queueID': node['queue_id'],
               'sample': node['sample'],
               'state': state,
               'progress': 1}

        logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))

        try:
            safe_emit('task', msg, namespace='/hwr')
        except Exception:
            logging.getLogger("HWR").error('error sending message: ' + str(msg))


def collect_started(*args, **kwargs):
    node = last_queue_node()

    if not qutils.is_interleaved(node["node"]):

        msg = {'Signal': kwargs['signal'],
               'Message': task_signals[kwargs['signal']],
               'taskIndex': last_queue_node()['idx'],
               'queueID': last_queue_node()['queue_id'],
               'sample': last_queue_node()['sample'],
               'state': RUNNING,
               'progress': 0}

        logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))

        try:
            safe_emit('task', msg, namespace='/hwr')
        except Exception:
            logging.getLogger("HWR").error('error sending message: ' + str(msg))


def grid_result_available(shape):
    socketio.emit('grid_result_available', {'shape': shape}, namespace='/hwr')


def energy_scan_finished(pk, ip, rm, sample):
    socketio.emit('energy_scan_result', {'pk': pk, 'ip': ip, 'rm': rm}, namespace='/hwr')


def queue_interleaved_started():
    node = last_queue_node()

    msg = {'Signal': "queue_interleaved_started",
           'Message': "Interleaved collection started",
           'taskIndex': node['idx'],
           'queueID': node['queue_id'],
           'sample': node['sample'],
           'state': RUNNING,
           'progress': 0}

    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))

    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def queue_interleaved_finished():
    node = last_queue_node()

    msg = {'Signal': "queue_interleaved_finished",
           'Message': "Interleaved collection ended",
           'taskIndex': node['idx'],
           'queueID': node['queue_id'],
           'sample': node['sample'],
           'state': COLLECTED,
           'progress': 1}

    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))

    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))


def queue_interleaved_sw_done(data):
    node = last_queue_node()
    progress = qutils.get_task_progress(node["node"], data)

    msg = {'Signal': 'collectImageTaken',
           'Message': task_signals['collectImageTaken'],
           'taskIndex': node['idx'],
           'queueID': node['queue_id'],
           'sample': node['sample'],
           'state': RUNNING if progress < 1 else COLLECTED,
           'progress': progress}

    logging.getLogger('HWR').debug('[TASK CALLBACK] ' + str(msg))

    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))

def xrf_task_progress(taskId, progress):
    node = last_queue_node()

    msg = {'Signal': 'XRFTaskUpdate',
           'Message': 'XRFTaskUpdate',
           'taskIndex': node['idx'],
           'queueID': node['queue_id'],
           'sample': node['sample'],
           'state': RUNNING if progress < 1 else COLLECTED,
           'progress': progress}

    try:
        safe_emit('task', msg, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").error('error sending message: ' + str(msg))

def send_shapes(update_positions = False, movable={}):
    shape_dict = {}
    for shape in mxcube.shapes.get_shapes():
        if update_positions:
            shape.update_position(mxcube.diffractometer.\
                                  motor_positions_to_screen)

        s = to_camel(shape.as_dict())
        shape_dict.update({shape.id: s})

    socketio.emit('update_shapes', {'shapes': shape_dict}, namespace='/hwr')


def motor_position_callback(movable):
    socketio.emit('motor_position', movable, namespace='/hwr')


def motor_state_callback(movable, sender=None, **kw):
    if movable["state"] == 2:
        # Re emit the position when the motor have finished to move
        # so that we are always sure that we have sent the final position
        motor_position_callback(movable)

        # Re calculate positions for shapes after motor finished to move
        send_shapes(update_positions = True, movable=movable)

        # Update the pixels per mm if it was the zoom motor that moved
        if movable["name"] == "zoom":
            ppm = mxcube.diffractometer.get_pixels_per_mm()
            socketio.emit('update_pixels_per_mm', {"pixelsPerMm": ppm}, namespace='/hwr')

    socketio.emit('motor_state', movable, namespace='/hwr')

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

    try:
        socketio.emit('beam_changed', {'data': ret}, namespace='/hwr')
    except Exception:
        logging.getLogger("HWR").exception('error sending message: %s' + str(msg))


def beamline_action_start(name):
    msg = {"name": name, "state": RUNNING}
    try:
        socketio.emit("beamline_action", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception("error sending beamline action message: %s", msg)


def beamline_action_done(name, result):
    msg = {"name": name, "state": READY, "data": result}
    try:
        socketio.emit("beamline_action", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception("error sending beamline action message: %s", msg)
    else:
        logging.getLogger('user_level_log').info('%s done.', name)


def beamline_action_failed(name):
    msg = {"name": name, "state": FAILED}
    try:
        socketio.emit("beamline_action", msg, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception("error sending beamline action message: %s", msg)
    else:
        logging.getLogger('user_level_log').error('Action %s failed !', name)


def safety_shutter_state_changed(values):
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole("safety_shutter")
    data = ho.dict_repr()
    try:
        socketio.emit("beamline_value_change", data, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error('error sending message: %s' + str(data))

def mach_info_changed(values):
    try:
        socketio.emit("mach_info_changed", values, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error('error sending message: %s' + str(msg))

def new_plot(plot_info):
    try:
        socketio.emit("new_plot", plot_info, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error('error sending new_plot message: %s', plot_info)

@Utils.RateLimited(1)
def plot_data(data, last_index=[0], **kwargs):
    data_data = data["data"]
    if last_index[0] > len(data_data):
      last_index = [0]

    data["data"] = data_data[last_index[0]:]

    try:
        socketio.emit("plot_data", data, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").exception('error sending plot_data message for plot %s', data['id'])
    else:
        last_index[0] += len(data_data)

def plot_end(data):
    try:
        socketio.emit("plot_end", data, namespace="/hwr")
    except Exception:
        logging.getLogger("HWR").error('error sending plot_end message for plot %s', data['id'])
