# -*- coding: utf-8 -*-
import os
import json
import cPickle as pickle
import redis

import Utils

import queue_model_objects_v1 as qmo
import queue_entry as qe
import queue_model_enumerables_v1 as qme

from flask import jsonify
from mock import Mock
from mxcube3 import app as mxcube
from mxcube3 import socketio
from . import limsutils

# Important: same constants as in constants.js
QUEUE_PAUSED = 'QueuePaused';
QUEUE_RUNNING = 'QueueStarted';
QUEUE_STOPPED = 'QueueStopped';
SAMPLE_MOUNTED = 0x8;
COLLECTED = 0x4
FAILED = 0x2
RUNNING = 0x1
UNCOLLECTED = 0x0

def node_index(node):
    """
    Get the position (index) in the queue, sample and node id of node <node>.

    :returns: dictionary on the form:
              {'sample': sample, 'idx': index, 'queue_id': node_id}
    """
    sample, index = None, None

    # RootNode nothing to return
    if isinstance(node, qmo.RootNode):
        sample, idx = None, None
    # For samples simply return the sampleID
    elif isinstance(node, qmo.Sample):
        sample = node.loc_str
    # TaskGroup just return the sampleID
    elif isinstance(node, qmo.TaskGroup):
        sample_loc, idx = node.get_parent().loc_str, None
    # All other TaskNodes are considered "leaf tasks", only return if they have
    # a parent (Which is not the case for reference collections, which are
    # orphans)
    elif node.get_parent():
        sample_model = node.get_parent().get_parent()
        sample = sample_model.loc_str
        task_groups = sample_model.get_children();
        group_list = [group.get_children() for group in task_groups]
        tlist = [task for task_list in group_list for task in task_list]
        # there is probably a better fix...
        try:
            index = tlist.index(node)
        except Exception:
            print 'node not in list: ', node

    return {'sample': sample, 'idx': index, 'queue_id': node._node_id}


def load_queue_from_dict(queue_dict):
    """
    Loads the queue in queue_dict in to the current mxcube queue (mxcube.queue)

    :param dict queue_dict: Queue dictionary, on the same format as returned by
                            queue_to_dict
    """
    if queue_dict:
        item_list = []

        for sid in queue_dict['sample_order']:
            item_list.append(queue_dict[sid])

        queue_add_item(item_list)


def queue_to_dict(node=None):
    """
    Returns the dictionary representation of the queue

    :param TaskNode node: Node to get representation for, queue root used if
                          nothing is passed.

    :returns: dictionary on the form:
              { sampleID_1:{ sampleID_1: sid_1,
                             queueID: qid_1,
                             location: location_n
                             tasks: [task1, ... taskn]},
                             .
                             .
                             .
                sampleID_N:{ sampleID_N: sid_N,
                             queueID: qid_N,
                             location: location_n,
                             tasks: [task1, ... taskn]}

             where the contents of task is a dictionary, the content depends on
             the TaskNode type (DataCollection, Chracterisation, Sample). The
             task dict can be directly used with the set_from_dict methods of
             the corresponding node.
    """
    if not node:
        node = mxcube.queue.get_model_root()

    return reduce(lambda x, y: x.update(y) or x, queue_to_dict_rec(node), {})


def queue_to_json(node=None):
    """
    Returns the json representation of the queue

    :param TaskNode node: Node to get representation for, queue root used if
                          nothing is passed.

    :returns: json str on the form:
              [ { sampleID_1: sid_1,
                  queueID: qid_1,
                  location: location_n
                  tasks: [task1, ... taskn]},
                .
                .
                .
                { sampleID_N: sid_N,
                  queueID: qid_N,
                  location: location_n,
                  tasks: [task1, ... taskn]} ]

             where the contents of task is a dictionary, the content depends on
             the TaskNode type (Datacollection, Chracterisation, Sample). The
             task dict can be directly used with the set_from_dict methods of
             the corresponding node.
    """
    if not node:
        node = mxcube.queue.get_model_root()

    res = reduce(lambda x, y: x.update(y) or x, queue_to_dict_rec(node), {})
    return json.dumps(res, sort_keys=True, indent=4)


def queue_to_json_response(node=None):
    """
    Returns the http json response object with the json representation of the
    queue as data.

    :param TaskNode node: Node to get representation for, queue root used if
                          nothing is passed.

    :returns: Flask Response object
    """
    if not node:
        node = mxcube.queue.get_model_root()

    res = reduce(lambda x, y: x.update(y) or x, queue_to_dict_rec(node), {})
    return jsonify(res)


def get_node_state(node_id):
    """
    Get the satus af the given node.

    :param TaskNode node: Node to get status for

    :returns: tuple containing (enabled, state)
            where state: {0, 1, 2, 3} = {in_queue, running, success, failed}
              {'sample': sample, 'idx': index, 'queue_id': node_id}
    """
    try:
        node, entry = get_entry(node_id)
    except:
        return (1, 0)
    executed = node.is_executed()
    enabled = node.is_enabled()
    failed = entry._execution_failed

    curr_entry = mxcube.queue.queue_hwobj.get_current_entry()

    if failed:
        state = FAILED
    elif executed:
        state = COLLECTED
    elif mxcube.queue.queue_hwobj.is_executing and (curr_entry == entry or curr_entry == entry._parent_container):
        state = RUNNING
    else:
        state = UNCOLLECTED

    return (enabled, state)


def get_queue_state():
    """
    Return the dictionary representation of the queue state plus some extra lists.

    :returns: dictionary on the form:
              {
                "history": [],
                "loaded": "1:01",
                "sample_list": [ sampleID_1, sampleID_2 ...],
                "queue": {sampleID_1: [task1, ... taskn]
                        .
                        .
                        .
                        sampleID_n: [task1, ... taskn] }
                "sample_list": {......}
               }
    """
    try:
        samples_list_sc = mxcube.sample_changer.getSampleList()
    except Exception:
        # if no sample changer is used, or if it has a problem,
        # set an empty list
        samples_list_sc = []
    
    samples = {}

    for s in samples_list_sc:
        sample_dm = s.getID() or ""
        sample_data = {"sampleID": s.getAddress(),
                       "location": ":".join(map(str, s.getCoords())),
                       "sampleName": "Sample-%s" % s.getAddress().replace(':', ''),
                       "code": sample_dm,
                       "type": "Sample"}

        sample_data["defaultPrefix"] = limsutils.get_default_prefix(sample_data, False)
        samples.update({s.getAddress(): sample_data})

    queue = queue_to_dict()
    try:
        order = queue.pop("sample_order")
    except Exception:
        order = []
        pass

    sample_list_ho = mxcube.queue.queue_hwobj._queue_entry_list
    sample_list = {}
    for sample in sample_list_ho:
        sample_model = sample.get_data_model()
        name = sample_model.loc_str

        sample_data = {"sampleID": name,
                       "location": "Manual" if sample_model.free_pin_mode else sample_model.loc_str,
                       "sampleName": sample_model.get_name(),
                       "type": "Sample",
                       "proteinAcronym": sample_model.crystals[0].protein_acronym,
                       "defaultPrefix": sample_model.get_name() + '-' + sample_model.crystals[0].protein_acronym
                       }

        sample_list.update({name: sample_data})

    loaded = ''

    res = {"sample_list": sample_list,
           "loaded": loaded,
           "queue": queue,
           "queueStatus": queue_exec_state()
           }

    return res


def _handle_dc(sample_id, node):
    parameters = node.as_dict()
    parameters["point"] = node.get_point_index()
    parameters["helical"] = node.experiment_type == qme.EXPERIMENT_TYPE.HELICAL

    parameters.pop('sample')
    parameters.pop('acquisitions')
    parameters.pop('acq_parameters')
    parameters.pop('centred_position')
    queueID = node._node_id
    enabled, state = get_node_state(queueID)

    res = {"label": "Data Collection",
           "type": "DataCollection",
           "parameters": parameters,
           "sampleID": sample_id,
           "taskIndex": node_index(node)['idx'],
           "queueID": queueID,
           "checked": enabled,
           "state": state,
           "limstResultData": mxcube.rest_lims.get_dc(node.id),
           }

    return res


def _handle_char(sample_id, node):
    parameters = node.characterisation_parameters.as_dict()
    parameters["point"] = node.get_point_index()
    refp = _handle_dc(sample_id, node.reference_image_collection)['parameters']
    parameters.update(refp)

    queueID = node._node_id
    enabled, state = get_node_state(queueID)

    res = {"label": "Characterisation",
           "type": "Characterisation",
           "parameters": parameters,
           "checked": node.is_enabled(),
           "sampleID": sample_id,
           "taskIndex": node_index(node)['idx'],
           "queueID": node._node_id,
           "checked": enabled,
           "state": state
           }

    return res


def _handle_sample(node):
    location = 'Manual' if node.free_pin_mode else node.loc_str
    enabled, state = get_node_state(node._node_id)

    children = node.get_children()

    children_states = []
    for child in children:
        child = child.get_children()[0]  # assuming on task on each task group
        child_enabled, child_state = get_node_state(child._node_id)
        children_states.append(child_state)

    if RUNNING in children_states:
        state = RUNNING & SAMPLE_MOUNTED
    elif 3 in children_states:
        state = FAILED & SAMPLE_MOUNTED
    elif all(i == COLLECTED for i in children_states) and len(children_states) > 0:
        state = COLLECTED & SAMPLE_MOUNTED
    else:
        state = UNCOLLECTED

    return {node.loc_str: {'sampleID': node.loc_str,
                           'queueID': node._node_id,
                           'location': location,
                           'sampleName': node.get_name(),
                           'proteinAcronym': node.crystals[0].protein_acronym,
                           'type': 'Sample',
                           'checked': enabled,
                           'state': state,
                           'tasks': queue_to_dict_rec(node)}}


def queue_to_dict_rec(node):
    """
    Parses node recursively and builds a representation of the queue based on
    python dictionaries.

    :param TaskNode node: The node to parse
    :returns: A list on the form:
              [ { sampleID_1: sid_1,
                  queueID: qid_1,
                  location: location_n
                  tasks: [task1, ... taskn]},
                .
                .
                .
                { sampleID_N: sid_N,
                  queueID: qid_N,
                  location: location_n,
                  tasks: [task1, ... taskn]} ]
    """
    result = []

    for node in node.get_children():
        if isinstance(node, qmo.Sample):
            if len(result) == 0:
                result = [{'sample_order': []}]

            result.append(_handle_sample(node))
            result[0]['sample_order'].append(node.loc_str)
        elif isinstance(node, qmo.Characterisation):
            sample_id = node.get_parent().get_parent().loc_str
            result.append(_handle_char(sample_id, node))
        elif isinstance(node, qmo.DataCollection):
            sample_id = node.get_parent().get_parent().loc_str
            result.append(_handle_dc(sample_id, node))
        else:
            result.extend(queue_to_dict_rec(node))


    return result


def queue_exec_state():
    """
    :returns: The queue execution state, one of QUEUE_STOPPED, QUEUE_PAUSED
              or QUEUE_RUNNING

    """
    state = QUEUE_STOPPED 

    if mxcube.queue.queue_hwobj.is_paused():
        state = QUEUE_PAUSED
    elif mxcube.queue.queue_hwobj.is_executing():
        state = QUEUE_RUNNING

    return state


def get_entry(id):
    """
    Retrieves the model and the queue entry for the model node with id <id>

    :param int id: Node id of node to retrieve
    :returns: The tuple model, entry
    :rtype: Tuple
    """
    model = mxcube.queue.get_node(int(id))
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(model)
    return model, entry


def delete_entry(entry):
    """
    Helper function that deletes an entry and its model from the queue
    """
    parent_entry = entry.get_container()
    parent_entry.dequeue(entry)
    model = entry.get_data_model()
    mxcube.queue.del_child(model.get_parent(), model)


def enable_entry(id, flag):
    """
    Helper function that sets the enabled flag to <flag> for the entry
    that has a model with node id <id>. Sets enabled flag on both entry and
    model.

    :param int id: Node id 
    :param bool flag: True for enabled False for disabled
    """
    model, entry = get_entry(id)
    entry.set_enabled(flag)
    model.set_enabled(flag)


def swap_task_entry(sid, ti1, ti2):
    """
    Swaps order of two queue entries in the queue, with the same sample <sid>
    as parent

    :param str sid: Sample id
    :param int ti1: Position of task1 (old position)
    :param int ti2: Position of task2 (new position)
    """
    current_queue = queue_to_dict() 

    node_id = current_queue[sid]["queueID"]
    smodel, sentry = get_entry(node_id)

    # Swap the order in the queue model
    ti2_temp_model = smodel.get_children()[ti2]
    smodel._children[ti2] = smodel._children[ti1]
    smodel._children[ti1] = ti2_temp_model

    # Swap queue entry order
    ti2_temp_entry = sentry._queue_entry_list[ti2]
    sentry._queue_entry_list[ti2] = sentry._queue_entry_list[ti1]
    sentry._queue_entry_list[ti1] = ti2_temp_entry


def move_task_entry(sid, ti1, ti2):
    """
    Swaps order of two queue entries in the queue, with the same sample <sid>
    as parent

    :param str sid: Sample id
    :param int ti1: Position of task1 (old position)
    :param int ti2: Position of task2 (new position)
    """
    current_queue = queue_to_dict()

    node_id = current_queue[sid]["queueID"]
    smodel, sentry = get_entry(node_id)

    # Move the order in the queue model
    smodel._children.insert(ti2, smodel._children.pop(ti1))

    # Swap queue entry order
    sentry._queue_entry_list.insert(ti2, sentry._queue_entry_list.pop(ti1))

def queue_add_item(item_list):
    """
    Adds the queue items in item_list to the queue. The items in the list can
    be either samples and or tasks. Samples are only added if they are not
    already in the queue  and tasks are appended to the end of an
    (already existing) sample. A task is ignored if the sample is not already
    in the queue.

    The items in item_list are dictionaries with the following structure:

    { "type": "Sample | DataCollection | Characterisation",
      "sampleID": sid
      ... task or sample specific data
    }

    Each item (dictionary) describes either a sample or a task.
    """

    for item in item_list:
        item_t = item["type"]
        current_queue = queue_to_dict()

        # If the item a sample, then add it and its tasks. If its not, get the
        # node id for the sample of the new task and append it to the sample
        sample_id = str(item["sampleID"])
        if item_t == "Sample":
            sample_node_id = add_sample(sample_id, item)
            tasks = item.get("tasks")

            if tasks:
                queue_add_item(tasks)
        else:
            sample_node_id = current_queue[sample_id]["queueID"]

        # The item is either a data_collection or a characterisation
        if item_t == "DataCollection":
            add_data_collection(sample_node_id, item)
        elif item_t == "Characterisation":
            add_characterisation(sample_node_id, item)


def add_sample(sample_id, item):
    """
    Adds a sample with sample id <sample_id> the queue.

    :param str sample_id: Sample id (often sample changer location)
    :returns: SampleQueueEntry
    """
    # Is the sample with location sample_id already in the queue,
    # in that case, send error response

    for sampleId, sampleData in queue_to_dict().iteritems():
        if sampleId == sample_id:
            msg = "[QUEUE] sample could not be added, already in the queue"
            raise Exception(msg)

    sample_model = qmo.Sample()

    # We should really use sample_id instead of loc_str
    sample_model.loc_str = sample_id
    sample_model.free_pin_mode = item['location'] == 'Manual'

    sample_model.set_name(item['sampleName'])
    sample_model.crystals[0].protein_acronym = item.get('proteinAcronym', '')

    if sample_model.free_pin_mode:
        sample_model.location = (None, sample_id)
    else:
        sample_model.location = tuple(map(int, item['location'].split(':')))

    sample_entry = qe.SampleQueueEntry(Mock(), sample_model)
    sample_entry.set_enabled(True)

    mxcube.queue.add_child(mxcube.queue.get_model_root(), sample_model)
    mxcube.queue.queue_hwobj.enqueue(sample_entry)

    return sample_model._node_id


def set_dc_params(model, entry, task_data):
    """
    Helper method that sets the data collection parameters for a DataCollection.

    :param DataCollectionQueueModel: The model to set parameters of
    :param DataCollectionQueueEntry: The queue entry of the model
    :param dict task_data: Dictionary with new parameters
    """
    acq = model.acquisitions[0]
    params = task_data['parameters']
    acq.acquisition_parameters.set_from_dict(params)


    acq.path_template.set_from_dict(params)
    acq.path_template.base_prefix = params['prefix']

    full_path = os.path.join(mxcube.session.get_base_image_directory(),
                             params.get('path', ''))
    acq.path_template.directory = full_path

    process_path = os.path.join(mxcube.session.get_base_process_directory(),
                                params.get('path', ''))
    acq.path_template.process_directory = process_path

    # If there is a centered position associated with this data collection, get
    # the necessary data for the position and pass it to the collection.
    if params["point"]:
        for cpos in mxcube.diffractometer.savedCentredPos:
            if cpos['posId'] == int(params['point']):
                _cpos = qmo.CentredPosition(cpos['motor_positions'])
                _cpos.index = int(params['point'])
                acq.acquisition_parameters.centred_position = _cpos

    if params["helical"]:
        model.experiment_type = qme.EXPERIMENT_TYPE.HELICAL

        if params["p1"]:
            for cpos in mxcube.diffractometer.savedCentredPos:
                if cpos['posId'] == int(params['p1']):
                    _cpos = qmo.CentredPosition(cpos['motor_positions'])
                    _cpos.index = int(params['p1'])
                    acq.acquisition_parameters.centred_position = _cpos

        if params["p2"]:
            acq2 = qmo.Acquisition()
            for cpos in mxcube.diffractometer.savedCentredPos:
                if cpos['posId'] == int(params['p2']):
                    _cpos = qmo.CentredPosition(cpos['motor_positions'])
                    _cpos.index = int(params['p2'])
                    acq2.acquisition_parameters.centred_position = _cpos
            model.acquisitions.append(acq2)

    model.set_enabled(task_data['checked'])
    entry.set_enabled(task_data['checked'])


def set_char_params(model, entry, task_data):
    """
    Helper method that sets the characterisation parameters for a
    Characterisation.

    :param CharacterisationQueueModel: The mode to set parameters of
    :param CharacterisationQueueEntry: The queue entry of the model
    :param dict task_data: Dictionary with new parameters
    """
    params = task_data['parameters']
    set_dc_params(model.reference_image_collection, entry, task_data)
    model.characterisation_parameters.set_from_dict(params)

    model.set_enabled(task_data['checked'])
    entry.set_enabled(task_data['checked'])


def _create_dc(task):
    """
    Creates a data collection model and its corresponding queue entry from
    a dict with collection parameters.

    :param dict task: Collection parameters
    :returns: The tuple (model, entry)
    :rtype: Tuple
    """
    dc_model = qmo.DataCollection()
    dc_entry = qe.DataCollectionQueueEntry(Mock(), dc_model)

    return dc_model, dc_entry


def add_characterisation(node_id, task):
    """
    Adds a data characterisation task to the sample with id: <id>

    :param int id: id of the sample to which the task belongs
    :param dict task: Task data (parameters)

    :returns: The queue id of the Data collection
    :rtype: int
    """
    sample_model, sample_entry = get_entry(node_id)
    params = task['parameters']

    refdc_model, refdc_entry = _create_dc(task)
    refdc_model.set_name('refdc')
    char_params = qmo.CharacterisationParameters().set_from_dict(params)

    char_model = qmo.Characterisation(refdc_model, char_params)
    char_entry = qe.CharacterisationGroupQueueEntry(Mock(), char_model)
    char_entry.queue_model_hwobj = mxcube.queue
    # Set the characterisation and reference collection parameters
    set_char_params(char_model, char_entry, task)

    # A characterisation has two TaskGroups one for the characterisation itself
    # and its reference collection and one for the resulting diffraction plans.
    # But we only create a reference group if there is a result !
    refgroup_model = qmo.TaskGroup()

    mxcube.queue.add_child(sample_model, refgroup_model)
    mxcube.queue.add_child(refgroup_model, char_model)
    refgroup_entry = qe.TaskGroupQueueEntry(Mock(), refgroup_model)

    refgroup_entry.set_enabled(True)
    sample_entry.enqueue(refgroup_entry)
    refgroup_entry.enqueue(char_entry)

    char_model.set_enabled(task['checked'])
    char_entry.set_enabled(task['checked'])

    return char_model._node_id


def add_data_collection(node_id, task):
    """
    Adds a data collection task to the sample with id: <id>

    :param int id: id of the sample to which the task belongs
    :param dict task: task data

    :returns: The queue id of the data collection
    :rtype: int
    """
    sample_model, sample_entry = get_entry(node_id)
    dc_model, dc_entry = _create_dc(task)
    set_dc_params(dc_model, dc_entry, task)

    pt = dc_model.acquisitions[0].path_template

    if mxcube.queue.check_for_path_collisions(pt):
        msg = "[QUEUE] data collection could not be added to sample: "
        msg += "path collision"
        raise Exception(msg)

    group_model = qmo.TaskGroup()

    group_model.set_enabled(True)
    mxcube.queue.add_child(sample_model, group_model)
    mxcube.queue.add_child(group_model, dc_model)

    group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
    group_entry.set_enabled(True)
    sample_entry.enqueue(group_entry)
    group_entry.enqueue(dc_entry)

    return dc_model._node_id


def new_queue():
    """
    Creates a new queue
    :returns: MxCuBE QueueModel Object
    """
    queue = pickle.loads(mxcube.empty_queue)
    init_signals(queue)
    return queue


def save_queue(session, redis=redis.Redis()):
    """
    Saves the current mxcube queue (mxcube.queue) into a redis database.
    The queue that is saved is the pickled result returned by queue_to_dict

    :param session: Session to save queue for
    :param redis: Redis database
    
    """
    proposal_id = Utils._proposal_id(session)
    
    if proposal_id is not None:
        # List of samples dicts (containing tasks) sample and tasks have same
        # order as the in queue HO
        queue = queue_to_dict(mxcube.queue.get_model_root())
        redis.set("mxcube:queue:%d" % proposal_id, pickle.dumps(queue))


def load_queue(session, redis=redis.Redis()):
    """
    Loads the queue belonging to session <session> into redis db <redis>

    :param session: Session for queue to load
    :param redis: Redis database
    """
    proposal_id = Utils._proposal_id(session)

    if proposal_id is not None:
        serialized_queue = redis.get("mxcube:queue:%d" % proposal_id)
        queue = pickle.loads(serialized_queue)
        load_queue_from_dict(queue)


def add_diffraction_plan(parent, child):
    """
    Listen to the addition of elements to the queue ('child_added')
    and if it is a diff plan create the appropiate queue entry and
    emit a socketio signal.
    This is to overcome the fact that the Characterisation entry only
    creates the model of the diff plan.
    """
    if isinstance(child, qmo.DataCollection):
        parent_model, parent_entry = get_entry(parent._node_id)
        # the parent

        if 'Diffraction plan' in parent_model.get_name():
            # name example string 'Diffraction plan - 3'
            # Then we do know that we need to add the entry here, Create a
            # new entry for the new child, in this case a data collection
            dc_entry = qe.DataCollectionQueueEntry(Mock(), child)
            dcg_entry = qe.TaskGroupQueueEntry(Mock(), parent)

            parent.set_enabled(True)
            dcg_entry.set_enabled(True)

            child.set_enabled(True)
            dc_entry.set_enabled(True)

            sample = parent.get_parent()  # mxcube.queue.get_model_root()
            sample_model, sample_entry = get_entry(sample._node_id)
            # TODO: check if the parent entry exits in case multiple diff plans
            sample_entry.enqueue(dcg_entry)

            # Add the entry to the newly created task group, brother to the
            # characterisation
            dcg_entry.enqueue(dc_entry)

            msg = _handle_dc(sample._node_id, child)
            msg['parameters']['typePrefix'] = 'P'
            # TODO: add saved centring pos id, centred_position is removed in
            # _handle_dc
            socketio.emit('add_task', msg, namespace='/hwr')


def init_signals(queue):
    """
    Initialize queue hwobj related signals.
    """
    import signals

    for signal in signals.collect_signals:
        mxcube.collect.connect(mxcube.collect, signal,
                               signals.task_event_callback)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationStarted',
                           signals.collect_oscillation_started)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationFailed',
                           signals.collect_oscillation_failed)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationFinished',
                           signals.collect_oscillation_finished)
    queue.connect(queue, 'child_added', add_diffraction_plan)

    queue.queue_hwobj.connect("queue_execute_started",
                              signals.queue_execution_started)

    queue.queue_hwobj.connect("queue_execution_finished",
                              signals.queue_execution_finished)

    queue.queue_hwobj.connect("collectEnded", signals.collect_ended)
