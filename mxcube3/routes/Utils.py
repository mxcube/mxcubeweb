import logging
import cPickle as pickle
import redis
import json

import queue_model_objects_v1 as qmo

from mock import Mock
from flask import jsonify
from mxcube3 import app as mxcube


class PickableMock(Mock):
    def __reduce__(self):
        return (Mock, ())


def queue_to_dict(node):
    return reduce(lambda x, y: x.update(y) or x, queue_to_json_rec(node), {})


def queue_to_json(node, debug=False):
    res = reduce(lambda x, y: x.update(y) or x, queue_to_json_rec(node), {})
    return json.dumps(res, sort_keys=True, indent=4)


def queue_to_json_response(node):
    res = reduce(lambda x, y: x.update(y) or x, queue_to_json_rec(node), {})
    return jsonify(res)


def _handle_dc(sample_id, node):
    parameters = node.as_dict()
    parameters["point"] = node.get_point_index()
    sample_id = node.get_parent().get_parent().loc_str
    
    parameters.pop('sample')
    parameters.pop('acquisitions')
    parameters.pop('acq_parameters')
    parameters.pop('centred_position')
    
    res = {"label": "Data Collection",
           "Type": "DataCollection",
           "parameters": parameters,
           "state": 0,
           "sampleID": sample_id,
           "queueID": node._node_id}

    return res

def queue_to_json_rec(node):
    result = []

    for node in node.get_children():
        if isinstance(node, qmo.Sample):
            result.append({node.loc_str: queue_to_json_rec(node)})
        elif isinstance(node, qmo.DataCollection):
            sample_id = node.get_parent().get_parent().loc_str
            result.append(_handle_dc(sample_id, node))
        elif isinstance(node, qmo.Characterisation):
            pass
        else:
            result.extend(queue_to_json_rec(node))

    return result


def _proposal_id(session):
    try:
        return int(session["loginInfo"]["loginRes"]["Proposal"]["number"])
    except (KeyError, TypeError, ValueError):
        return None


def save_queue(session, redis=redis.Redis()):
    proposal_id = _proposal_id(session)
    if proposal_id is not None:
        redis.set("mxcube:queue:%d" % proposal_id, pickle.dumps(mxcube.queue))


def new_queue(serialized_queue=None):
    if not serialized_queue:
        serialized_queue = mxcube.empty_queue
    queue = pickle.loads(serialized_queue)
    import Queue
    Queue.init_signals(queue)
    return queue


def get_queue(session, redis=redis.Redis()):
    proposal_id = _proposal_id(session)
    if proposal_id is not None:
        serialized_queue = redis.get("mxcube:queue:%d" % proposal_id)
    else:
        serialized_queue = None

    return new_queue(serialized_queue)


def get_light_state_and_intensity():
    ret = dict()

    for light in ('BackLight', 'FrontLight'):
        item_role = light.lower()

        hwobj = mxcube.diffractometer.getObjectByRole(item_role)

        if hasattr(hwobj, "getActuatorState"):
            switch_state = 1 if hwobj.getActuatorState() == 'in' else 0
        else:
            hwobj_switch = mxcube.diffractometer.getObjectByRole(light + 'Switch')
            switch_state = 1 if hwobj_switch.getActuatorState() == 'in' else 0

        ret.update({light: {"Status": hwobj.getState(), "position": hwobj.getPosition()},
                    light + 'Switch': {"Status": switch_state, "position": 0}
                    })

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
        else:
            if hasattr(hwobj, "getCurrentPositionName"):
                # a motor similar to zoom
                pos_name = hwobj.getCurrentPositionName()
                if pos_name:
                    pos = hwobj.predefinedPositions[pos_name]
                else:
                    pos = None
                return {item_name: {"Status": hwobj.getState(), "position": pos}}
            else:
		pos = hwobj.getPosition()
		try:
		    pos = round(pos, 2)
		except:
		    pass
                return {item_name: {'Status': hwobj.getState(), 'position': pos}}
    except Exception:
        logging.getLogger('HWR').exception('[UTILS.GET_MOVABLE_STATE_AND_POSITION] could not get item "%s"' % item_name)


def get_centring_motors_info():
    # the centring motors are: ["phi", "focus", "phiz", "phiy", "zoom", "sampx", "sampy", "kappa", "kappa_phi"]
    ret = dict()
    for name in mxcube.diffractometer.centring_motors_list:
        motor_info = get_movable_state_and_position(name)
        if motor_info and motor_info[name]['position'] is not None:
            ret.update(motor_info)
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
        # Procedure to be done before main implmentation
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
