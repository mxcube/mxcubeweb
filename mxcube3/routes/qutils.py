# -*- coding: utf-8 -*-
import os
import json
import cPickle as pickle
import redis

import Utils

import queue_model_objects_v1 as qmo
import queue_entry as qe

from flask import jsonify
from mock import Mock
from mxcube3 import app as mxcube


class PMock(Mock):
    def __reduce__(self):
        return (Mock, ())


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
        index = tlist.index(node)

    return {'sample': sample, 'idx': index, 'queue_id': node._node_id}


def queue_to_dict(node=None):
    """
    Returns the dictionary representation of the queue

    :param TaskNode node: Node to get representation for, queue root used if
                          nothing is passed.

    :returns: dictionary on the form:
              { sampleID_1: [task1, ... taskn]
                .
                .
                .
                sampleID_n: [task1, ... taskn] }

             where the contents of task is a dictionary, the content depends on
             the TaskNode type (DataCollection, Chracterisation, Sample). The
             task dict can be directly used with the set_from_dict methods of
             the corresponding node.
    """
    if not node:
        node = mxcube.queue.get_model_root()

    return reduce(lambda x, y: x.update(y) or x, queue_to_json_rec(node), {})


def queue_to_json(node=None):
    """
    Returns the json representation of the queue

    :param TaskNode node: Node to get representation for, queue root used if
                          nothing is passed.

    :returns: json str on the form:
              { sampleID_1: [task1, ... taskn]
                .
                .
                .
                sampleID_n: [task1, ... taskn] }

             where the contents of task is a dictionary, the content depends on
             the TaskNode type (Datacollection, Chracterisation, Sample). The
             task dict can be directly used with the set_from_dict methods of
             the corresponding node.
    """
    if not node:
        node = mxcube.queue.get_model_root()
    
    res = reduce(lambda x, y: x.update(y) or x, queue_to_json_rec(node), {})
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
    
    res = reduce(lambda x, y: x.update(y) or x, queue_to_json_rec(node), {})
    return jsonify(res)


def _handle_dc(sample_id, node):
    parameters = node.as_dict()
    parameters["point"] = node.get_point_index()

    parameters.pop('sample')
    parameters.pop('acquisitions')
    parameters.pop('acq_parameters')
    parameters.pop('centred_position')
 
    res = {"label": "Data Collection",
           "type": "DataCollection",
           "parameters": parameters,
           "checked": node.is_enabled(),
           "sampleID": sample_id,
           "taskIndex": node_index(node)['idx'],
           "queueID": node._node_id}

    return res


def _handle_char(sample_id, node):
    parameters = node.characterisation_parameters.as_dict()
    parameters["point"] = node.get_point_index()
    refp = _handle_dc(sample_id, node.reference_image_collection)['parameters']
    parameters.update(refp)

    res = {"label": "Characterisation",
           "type": "Characterisation",
           "parameters": parameters,
           "checked": node.is_enabled(),
           "sampleID": sample_id,
           "taskIndex": node_index(node)['idx'],
           "queueID": node._node_id}

    return res


def queue_to_json_rec(node):
    """
    Parses node recursively and builds a representation of the queue based on
    python dictionaries.

    :param TaskNode node: The node to parse
    :returns: A list on the form:
              [ {sampleID_1: [task1, ... taskn]},
                .
                . 
                {sampleID_N: [task1, ... taskn]} ]
    """
    result = []

    for node in node.get_children():
        if isinstance(node, qmo.Sample):
            result.append({node.loc_str: {'sampleID': node.loc_str,
                                          'queueID': node._node_id,
                                          'tasks': queue_to_json_rec(node)}})
        elif isinstance(node, qmo.Characterisation):
            sample_id = node.get_parent().get_parent().loc_str
            result.append(_handle_char(sample_id, node))
        elif isinstance(node, qmo.DataCollection):
            sample_id = node.get_parent().get_parent().loc_str
            result.append(_handle_dc(sample_id, node))
        else:
            result.extend(queue_to_json_rec(node))

    return result


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
    current_queue = queue_to_dict()

    for item in item_list:
        item_t = item["type"]

        # Is the item a sample, then add it and its tasks. If its not, get the
        # node id for the sample of the new task and append it to the sample
        sample_id = str(item["sampleID"])
        if item_t == "Sample":
            sample_node_id = add_sample(sample_id)
            tasks = item["tasks"]

            if tasks:
                queue_add_item(tasks)
        else:
            sample_node_id = current_queue[sample_id]["queueID"]

        # The item is either a data_collection or a characterisation
        if item_t == "DataCollection":
            add_data_collection(sample_node_id, item)
        elif item_t == "Characterisation":
            add_characterisation(sample_node_id, item)


def add_sample(sample_id):
    """
    Adds a sample with sample id <sample_id> the queue.

    :param str sample_id: Sample id (often sample changer location)
    :returns: SampleQueueEntry
    """
    sample_model = qmo.Sample()
    sample_model.loc_str = str(sample_id)
    sample_model.free_pin_mode = (not mxcube.diffractometer.use_sc)

    # Is the sample with location sample_id already in the queue,
    # in that case, send error response
    for sampleId, sampleData in queue_to_dict().iteritems():
        if sampleId == sample_id:
            msg = "[QUEUE] sample could not be added, already in the queue"
            raise Exception(msg)
        
    try:
        # Are we using the sample changer or is a sample put on the pin
        # manually
        if mxcube.diffractometer.use_sc:
            basket_number, sample_number = sample_id.split(':')
        else:
            basket_number, sample_number = (None, sample_id)

        sample_model.location = (basket_number, sample_number)

    except AttributeError as ex:
        msg = '[QUEUE] sample could not be added, %s' % str(ex)
        raise Exception(msg)

    sample_entry = qe.SampleQueueEntry(PMock(), sample_model)
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

    full_path = os.path.join(mxcube.session.get_base_image_directory(),
                             params.get('path', 'dummy_path'))

    acq.path_template.directory = full_path

    # If there is a centered position associated with this data collection, get
    # the necessary data for the position and pass it to the collection.
    if int(params["point"]) > 0:
        for cpos in mxcube.diffractometer.savedCentredPos:
            if cpos['posId'] == int(params['point']):
                _cpos = qmo.CentredPosition(cpos['motor_positions'])
                _cpos.index = int(params['point'])
                acq.acquisition_parameters.centred_position = _cpos

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
    dc_entry = qe.DataCollectionQueueEntry(PMock(), dc_model)

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
    char_params = qmo.CharacterisationParameters().set_from_dict(params)

    char_model = qmo.Characterisation(refdc_model, char_params)
    char_entry = qe.CharacterisationGroupQueueEntry(PMock(), char_model)

    # Set the characterisation and reference collection parameters 
    set_char_params(char_model, char_entry, task)

    # A characterisation has two TaskGroups one for the characterisation itself
    # and its reference collection and one for the resulting diffraction plans.
    # But we only create a reference group if there is a result !   
    refgroup_model = qmo.TaskGroup()

    mxcube.queue.add_child(sample_model, refgroup_model)
    mxcube.queue.add_child(refgroup_model, char_model)
    
    refgroup_entry = qe.TaskGroupQueueEntry(PMock(), refgroup_model)
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

    group_entry = qe.TaskGroupQueueEntry(PMock(), group_model)
    group_entry.set_enabled(True)
    sample_entry.enqueue(group_entry)
    group_entry.enqueue(dc_entry)

    return dc_model._node_id


def save_queue(session, redis=redis.Redis()):
    proposal_id = Utils._proposal_id(session)
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
    proposal_id = Utils._proposal_id(session)
    if proposal_id is not None:
        serialized_queue = redis.get("mxcube:queue:%d" % proposal_id)
    else:
        serialized_queue = None

    return new_queue(serialized_queue)
