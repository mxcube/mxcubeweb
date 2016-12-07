import logging
from mxcube3 import app as mxcube
from mxcube3 import remote_access
from mxcube3 import socketio
import time
import gevent
import gevent.event
import types
import inspect
import base64
import os
import sys

SNAPSHOT_RECEIVED = gevent.event.Event()
SNAPSHOT = None

def RateLimited(maxPerSecond):
    minInterval = 1.0 / float(maxPerSecond)
    def decorate(func):
        lastTimeCalled = [0.0]
        def rateLimitedFunction(*args,**kargs):
            elapsed = time.time() - lastTimeCalled[0]
            leftToWait = minInterval - elapsed
            if leftToWait>0:
                # ignore update
                return
            ret = func(*args,**kargs)
            lastTimeCalled[0] = time.time()
            return ret
        return rateLimitedFunction
    return decorate


def _proposal_id(session):
    try:
        return int(session["loginInfo"]["loginRes"]["Proposal"]["number"])
    except (KeyError, TypeError, ValueError):
        return None


def get_light_state_and_intensity():
    """
    Return the light actuator state (in/out) and the light motor level. It takes
    into accojunt the two find of light hwobj available
        * MicrodiffLight + MicrodiffInOut
        * Combined hwobj such as ID30Light
    """
    ret = dict()

    for light in ('BackLight', 'FrontLight'):
        item_role = light.lower()

        hwobj = mxcube.diffractometer.getObjectByRole(item_role)

        if hasattr(hwobj, "getActuatorState"):
            switch_state = 1 if hwobj.getActuatorState() == 'in' else 0
        else:
            hwobj_switch = mxcube.diffractometer.getObjectByRole(light + 'Switch')
            switch_state = 1 if hwobj_switch.getActuatorState() == 'in' else 0

        ret.update({light: {"Status": hwobj.getState(), "position": hwobj.getPosition(),
                            'limits': hwobj.getLimits()},
                    light + 'Switch': {"Status": switch_state, "position": 0}
                    })

    return ret

def get_light_limits():
    ret = dict()

    for light in ('BackLight', 'FrontLight'):
        item_role = light.lower()

        hwobj = mxcube.diffractometer.getObjectByRole(item_role)

        ret.update({light: {'limits': hwobj.getLimits()}})

    return ret

def get_movable_state_and_position(item_name):
    item_role = item_name.lower()
    ret = dict()

    try:
        if 'light' in item_role:
            # handle all *light* items in the same way;
            # this returns more than needed, but it doesn't
            # matter
            return get_light_state_and_intensity()

        hwobj = mxcube.diffractometer.getObjectByRole(item_role)

        if hwobj is None:
            logging.getLogger("HWR").error('[UTILS.GET_MOVABLE_STATE_AND_POSITION] No movable with role "%s"' % item_role)
            return {item_name: { 'Status': None, 'position': None }}
        else:
            if hasattr(hwobj, "getCurrentPositionName"):
                # a motor similar to zoom
                pos_name = hwobj.getCurrentPositionName()
                if pos_name:
                    pos = hwobj.predefinedPositions[pos_name]
                else:
                    pos = None
            else:
                pos = hwobj.getPosition()

            return {item_name: {'Status': hwobj.getState(), 'position': pos}}
    except Exception:
        logging.getLogger('HWR').exception('[UTILS.GET_MOVABLE_STATE_AND_POSITION] could not get item "%s"' % item_name)

def get_movable_limits(item_name):
    item_role = item_name.lower()
    ret = dict()

    try:
        if 'light' in item_role:
            # handle all *light* items in the same way;
            # this returns more than needed, but it doesn't
            # matter
            return get_light_limits()

        hwobj = mxcube.diffractometer.getObjectByRole(item_role)

        if hwobj is None:
            logging.getLogger("HWR").error('[UTILS.GET_MOVABLE_LIMIT] No movable with role "%s"' % item_role)
            limits = ()
        else:
            limits = hwobj.getLimits()

            return {item_name: {'limits': limits}}
    except Exception:
        logging.getLogger('HWR').exception('[UTILS.GET_MOVABLE_LIMIT] could not get item "%s"' % item_name)

def get_centring_motors_info():
    # the centring motors are: ["phi", "focus", "phiz", "phiy", "zoom", "sampx", "sampy", "kappa", "kappa_phi"]
    ret = dict()
    for name in mxcube.diffractometer.centring_motors_list:
        print name
        motor_info = get_movable_state_and_position(name)
        if motor_info and motor_info[name]['position'] is not None:
            ret.update(motor_info)
#        print ret
        motor_limits = get_movable_limits(name)
        if motor_limits and motor_limits[name]['limits'] is not None:
            ret[name].update(motor_limits[name])
#        print ret
    return ret


def my_execute_entry(self, entry):
    import queue_entry as qe
    import time
    import random
    from mxcube3 import app as mxcube
    self.emit('centringAllowed', (False, ))
    self._current_queue_entries.append(entry)
    print "executing on my waaaaay madarikatuak"
    print entry
    if isinstance(entry, qe.DataCollectionQueueEntry):
        time.sleep(1)
        # mxcube.collect.emit('collectOscillationStarted')
        # time.sleep(2)
        #logging.getLogger('HWR').info('[COLLECT] collectOscillationStarted')
        mxcube.collect.emit('collectStarted')
        time.sleep(2)
        # mxcube.collect.emit('collectOscillationFinished')
        # time.sleep(2)
        foo = ['collectOscillationFinished', 'collectOscillationFailed', 'warning']
        mxcube.collect.emit(random.choice(foo))
    elif isinstance(entry, qe.CharacterisationGroupQueueEntry):
        time.sleep(1)
        mxcube.collect.emit('collectOscillationStarted')
        #logging.getLogger('HWR').info('[COLLECT] collectOscillationStarted')
        time.sleep(2)
        foo = ['collectOscillationFinished', 'collectOscillationFailed', 'warning']
        mxcube.collect.emit(random.choice(foo))
    elif isinstance(entry, qe.SampleCentringQueueEntry):
        time.sleep(1)
        mxcube.diffractometer.emit('centringStarted')
        time.sleep(2)
        foo = ['centringSuccessful', 'centringFailed', 'warning']
        mxcube.diffractometer.emit(random.choice(foo))
        #mxcube.diffractometer.emit('centringSuccessful')

    #logging.getLogger('HWR').info('Calling execute on my execute_entry method')
    #logging.getLogger('HWR').info('Calling execute on: ' + str(entry))
    #logging.getLogger('HWR').info('Using model: ' + str(entry.get_data_model()))

    for child in entry._queue_entry_list:
        self.my_execute_entry(child)

    self._current_queue_entries.remove(entry)
    print "executing on my waaaaay madarikatuak finished"


def __execute_entry(self, entry):
    print "my execute_entry"
    from routes.Queue import queue, last_queue_node
    import logging
    logging.getLogger('queue_exec').info('Executing mxcube3 customized entry')

    node = entry.get_data_model()
    nodeId = node._node_id
    parentId = int(node.get_parent()._node_id)
    #if this is a sample, parentId will be '0'
    if parentId == 0:  # Sample... 0 is your father...
        parentId = nodeId
    last_queue_node.update({'id': nodeId, 'sample': queue[parentId]['SampleId']})
    print "enabling....", entry
    #entry.set_enabled(True)
    if not entry.is_enabled() or self._is_stopped:
        logging.getLogger('queue_exec').info('Cannot excute entry: ' + str(nodeId) + '. Entry not enabled or stopped.')
        return
    self.emit('centringAllowed', (False, ))
    self._current_queue_entries.append(entry)
    logging.getLogger('queue_exec').info('Calling execute on: ' + str(entry))
    logging.getLogger('queue_exec').info('Using model: ' + str(entry.get_data_model()))
    if self.is_paused():
        logging.getLogger('user_level_log').info('Queue paused, waiting ...')
        entry.get_view().setText(1, 'Queue paused, waiting')
    self.wait_for_pause_event()
    try:
        # Procedure to be done before main implementation
        # of task.
        entry.pre_execute()
        entry.execute()

        for child in entry._queue_entry_list:
            self.__execute_entry(child)

    except queue_entry.QueueSkippEntryException:
        # Queue entry, failed, skipp.
        pass
    except (queue_entry.QueueAbortedException, Exception) as ex:
        # Queue entry was aborted in a controlled, way.
        # or in the exception case:
        # Definetly not good state, but call post_execute
        # in anyways, there might be code that cleans up things
        # done in _pre_execute or before the exception in _execute.
        entry.post_execute()
        entry.handle_exception(ex)
        raise ex
    else:
        entry.post_execute()

    self._current_queue_entries.remove(entry)

def _snapshot_received(snapshot_jpg):
    global SNAPSHOT
    SNAPSHOT = base64.b64decode(snapshot_jpg.split(',')[1])
    SNAPSHOT_RECEIVED.set()

def _do_take_snapshot(filename):
    SNAPSHOT_RECEIVED.clear()

    socketio.emit('take_xtal_snapshot', namespace='/hwr', room=remote_access.MASTER_ROOM, callback=_snapshot_received)

    SNAPSHOT_RECEIVED.wait(timeout=30)

    with file(filename, 'wb') as snapshot_file:
      snapshot_file.write(SNAPSHOT)
    

def take_snapshots(self, snapshots=None, _do_take_snapshot=_do_take_snapshot):
    if snapshots is None:
        # called via AbstractCollect
        dc_params = self.current_dc_parameters
        diffractometer = self.diffractometer_hwobj
        move_omega_relative = diffractometer.move_omega_relative
    else:
        # called via AbstractMultiCollect
        calling_frame = inspect.currentframe(2)
        dc_params = calling_frame.f_locals['data_collect_parameters']
        diffractometer = self.diffractometer()
        move_omega_relative = diffractometer.phiMotor.syncMoveRelative

    number_of_snapshots = dc_params.get("take_snapshots", 4)
    if number_of_snapshots == True:
        # backward compatibility
        number_of_snapshots = 4 
  
    if number_of_snapshots > 0:
        snapshot_directory = dc_params["fileinfo"]["archive_directory"]
        if not os.path.exists(snapshot_directory):
            try:
                self.create_directories(snapshot_directory)
            except Exception:
                logging.getLogger("HWR").exception("Collection: Error creating snapshot directory")

        logging.getLogger("user_level_log").info(\
                 "Collection: Taking %d sample snapshot(s)" % number_of_snapshots)

        for snapshot_index in range(number_of_snapshots):
            snapshot_filename = os.path.join(\
                   snapshot_directory,
                   "%s_%s_%s.snapshot.jpeg" % (\
                   dc_params["fileinfo"]["prefix"],
                   dc_params["fileinfo"]["run_number"],
                   (snapshot_index + 1)))
            dc_params['xtalSnapshotFullPath%i' % \
                (snapshot_index + 1)] = snapshot_filename

            try:
                _do_take_snapshot(snapshot_filename)
            except Exception:
                sys.excepthook(*sys.exc_info())
                raise RuntimeError("Could not take snapshot '%s`", snapshot_filename)

            if number_of_snapshots > 1:
                move_omega_relative(90)


def enable_snapshots(collect_object):
    # patch collect object
    collect_object.take_crystal_snapshots = types.MethodType(take_snapshots, collect_object)
     
