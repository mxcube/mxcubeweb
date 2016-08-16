import json
import jsonpickle
import logging
import os
import signals

from flask import Response, jsonify, request, session

import queue_model_objects_v1 as qmo
import queue_entry as qe
import QueueManager
import Utils

from mxcube3 import app as mxcube
from mxcube3 import socketio

from Utils import PickableMock as Mock

qm = QueueManager.QueueManager('Mxcube3')


def init_signals(queue):
    """Initialize hwobj signals."""
    for signal in signals.collect_signals:
        mxcube.collect.connect(mxcube.collect, signal,
                               signals.task_event_callback)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationStarted',
                           signals.collect_oscillation_started)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationFailed',
                           signals.collect_oscillation_failed)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationFinished',
                           signals.collect_oscillation_finished)
    queue.last_queue_node = {'id': 0, 'sample': '0:0'}

# ##----QUEUE ACTIONS----##


@mxcube.route("/mxcube/api/v0.1/queue/start", methods=['PUT'])
def queue_start():
    """
    Start execution of the queue.

        :statuscode: 200: no error
        :statuscode: 409: queue could not be started
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to start')
    mxcube.queue.queue_hwobj.disable(False)
    mxcube.queue.queue_hwobj.execute()
    #mxcube.queue.queue_hwobj._QueueManager__execute_entry = types.MethodType(Utils.__execute_entry, mxcube.queue.queue_hwobj)
    logging.getLogger('HWR').info('[QUEUE] Queue started')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/stop", methods=['PUT'])
def queue_stop():
    """
    Stop execution of the queue.

        :statuscode: 200: no error
        :statuscode: 409: queue could not be stopped
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to stop')
    global queue_has_to_be_stopped
    queue_has_to_be_stopped = True

    if mxcube.queue.queue_hwobj._root_task is not None:
        # the whole queue has been started
        mxcube.queue.queue_hwobj.stop()
    else:
        # the queue has not started but an entry, but check if there is an entry before
        current_entry = mxcube.queue.queue_hwobj.get_current_entry()
        if current_entry is not None:
            current_entry.stop()
    logging.getLogger('HWR').info('[QUEUE] Queue stopped')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/abort", methods=['PUT'])
def queue_abort():
    """
    Abort execution of the queue.

        :statuscode: 200: no error
        :statuscode: 409: queue could not be aborted
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to abort')
    global queue_has_to_be_stopped
    queue_has_to_be_stopped = True

    if mxcube.queue.queue_hwobj._root_task is not None:
        # the whole queue has been started
        mxcube.queue.queue_hwobj.stop()
    else:
        # the queue has not started but an entry, but check if there is an entry before
        current_entry = mxcube.queue.queue_hwobj.get_current_entry()
        if current_entry is not None:
            current_entry.stop()
    logging.getLogger('HWR').info('[QUEUE] Queue aborted')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/pause", methods=['PUT'])
def queue_pause():
    """
    Pause the execution of the queue
        :statuscode: 200: no error
        :statuscode: 409: queue could not be paused
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to pause')
    mxcube.queue.queue_hwobj.pause(True)
    msg = {'Signal': 'QueuePaused',
           'Message': 'Queue execution paused',
           'State': 1}
    socketio.emit('Queue', msg, namespace='/hwr')
    logging.getLogger('HWR').info('[QUEUE] Queue paused')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/unpause", methods=['PUT'])
def queue_unpause():
    """
    Unpause execution of the queue
        :statuscode: 200: no error
        :statuscode: 409: queue could not be unpause
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to unpause')
    mxcube.queue.queue_hwobj.pause(False)
    msg = {'Signal': 'QueueStarted',
           'Message': 'Queue execution started',
           'State': 1}
    socketio.emit('Queue', msg, namespace='/hwr')
    logging.getLogger('HWR').info('[QUEUE] Queue unpaused')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/clear", methods=['PUT', 'GET'])
def queue_clear():
    """
    Clear the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be started
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to clear')

    mxcube.diffractometer.savedCentredPos = []
    mxcube.queue = Utils.new_queue()
    Utils.save_queue(session)
    logging.getLogger('HWR').info('[QUEUE] Queue cleared  ' +
                                  str(mxcube.queue.get_model_root()._name))
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue", methods=['GET'])
def queue_get():
    """
    Get the queue.
        :response Content-Type: application/json, an object containing
            queue entries (sample with the associated children
            tasks plus their parameters)
        :statuscode: 200: no error
        :statuscode: 409: queue could not be retrieved
        :example response: (without any task)  {
                                 "1":{
                                    "QueueId": 1,
                                    "SampleId": "1:04",
                                    "checked": 0,
                                    "methods": []
                                  },
                                  "2":{
                                    "QueueId": 2,
                                    "SampleId": "1:02",
                                    "checked": 0,
                                    "methods": []
                                  }
                            }
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting data')
    resp = jsonify(serialize_queue_to_json())
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['PUT', 'POST'])
def queue_save_state():
    """
    Save the queue to the session.
        :request Content-Type: application/json, sampleGrid state sent
         by the client.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be saved
    """

    params = request.data
    params = json.loads(params)

    sample_grid_state = session.get("sampleGridState")

    try:
        Utils.save_queue(session)
    except Exception:
        return Response(status=409)

    sample_grid_state.update(params['sampleGridState'])
    session["sampleGridState"] = sample_grid_state

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['GET'])
def queue_load_state():
    """
    Load and apply the queue from the session and return the simplified saved
    queue and sample_list. NOTE: the client does not do anything with it yet.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be loaded
    """
    samples_list = mxcube.sample_changer.getSampleList()
    samples = {}
    for s in samples_list:
        sample_dm = s.getID() or ""
        samples.update(
            {s.getAddress():
                {
                    "id": s.getAddress(),
                    "location": ":".join(map(str, s.getCoords())),
                    "code": sample_dm,
                    "methods": {}
            }})

    if mxcube.queue.queue_hwobj._queue_entry_list:
        logging.getLogger('HWR').info('[QUEUE] Looks like a queue was stored')
        resp = jsonify({'queueState': serialize_queue_to_json(),
                        'sampleList': samples})
        resp.status_code = 200
        return resp
    else:
        logging.getLogger('HWR').info('[QUEUE] No queue was stored...')
        resp = jsonify({'queueState': {}, 'sampleList': samples})
        resp.status_code = 200
        return resp


@mxcube.route("/mxcube/api/v0.1/queue/<int:node_id>/execute", methods=['PUT'])
def execute_entry_with_id(node_id):
    """
    Execute the given queue entry
        :parameter node_id: entry identifier, integer. It can be a sample or
         a task within a sample
        :statuscode: 200: no error, the given entry was sent to execution
        (any further error might still happen)
        :statuscode: 409: queue entry could not be executed
    """
    # last_queue_node = mxcube.queue.last_queue_node
    #  WARNING: serialize_queue_to_json() should only be used for sending
    #  to the client,
    #  here on the back-end side we should just always use mxcube.queue !
    queue = serialize_queue_to_json()
    global queue_has_to_be_stopped
    queue_has_to_be_stopped = False
    node = mxcube.queue.get_node(node_id)
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)

    msg = {'Signal': 'QueueStarted',
           'Message': 'Queue execution started',
           'State': 1}
    socketio.emit('Queue', msg, namespace='/hwr')

    mxcube.queue.queue_hwobj.set_pause(False)
    if isinstance(entry, qe.SampleQueueEntry):
        logging.getLogger('HWR').info('[QUEUE] Queue going to execute sample entry with id: %s' % node_id)
        #  this is a sample entry, thus, go through its checked children and execute those
        for elem in queue[node_id]['methods']:
            if queue_has_to_be_stopped:
                break
        for elem in queue[node_id]['methods']:
            if int(elem['checked']) == 1:
                logging.getLogger('HWR').info('[QUEUE] Queue executing children entry with id: %s' % elem['QueueId'])
                child_node = mxcube.queue.get_node(elem['QueueId'])
                child_entry = mxcube.queue.queue_hwobj.get_entry_with_model(child_node)
                child_entry._view = Mock()  # associated text deps
                child_entry._set_background_color = Mock()  # widget color deps
                try:
                    if mxcube.queue.queue_hwobj.is_paused():
                        logging.getLogger('HWR').info('[QUEUE] Cannot execute, queue is paused. Waiting for unpause')
                        msg = {'Signal': 'QueuePaused',
                               'Message': 'Queue execution paused',
                               'State': 1}  # 1: started
                        socketio.emit('Queue', msg, namespace='/hwr')
                        mxcube.queue.queue_hwobj.wait_for_pause_event()
                    mxcube.queue.last_queue_node.update({'id': elem['QueueId'],
                                                         'sample': queue[node_id]['SampleId']})
                    # mxcube.queue.queue_hwobj.execute_entry = types.MethodType(Utils.my_execute_entry, mxcube.queue.queue_hwobj)
                    mxcube.queue.queue_hwobj.execute_entry(child_entry)
                    child_entry.set_enabled(False)
                except Exception:
                    logging.getLogger('HWR').exception('[QUEUE] Queue error executing child entry with id: %s' % elem['QueueId'])
    else:
        #  not a sample so execute directly
        logging.getLogger('HWR').info('[QUEUE] Queue executing entry with id: %s' % node_id)
        if mxcube.queue.queue_hwobj.is_paused():
            logging.getLogger('HWR').info('[QUEUE] Cannot execute, queue is paused. Waiting for unpause')
            msg = {'Signal': 'QueuePaused',
                   'Message': 'Queue execution paused',
                   'State': 1}
            socketio.emit('Queue', msg, namespace='/hwr')
            mxcube.queue.queue_hwobj.wait_for_pause_event()

        entry._view = Mock()  # associated text deps
        entry._set_background_color = Mock()  # widget color deps
        #  parent = int(node.get_parent()._node_id)
        # this is a TaskGroup, so it is not in the parsed queue
        parent_node = node.get_parent() 
        #  go a level up,
        # this is a TaskGroup for a Char, a sampleQueueEntry if DataCol
        parent_node = parent_node.get_parent()  
        if isinstance(parent_node, qmo.TaskGroup):
            parent_node = parent_node.get_parent()
        parent = int(parent_node._node_id)

        mxcube.queue.last_queue_node.update({'id': node_id,
                                             'sample': queue[parent]['SampleId']
                                             })
        # mxcube.queue.queue_hwobj.execute_entry = types.MethodType(Utils.my_execute_entry, mxcube.queue.queue_hwobj)
        mxcube.queue.queue_hwobj.execute_entry(entry)
        entry.set_enabled(False)

    msg = {'Signal': 'QueueStopped',
           'Message': 'Queue execution stopped',
           'State': 1}
    socketio.emit('Queue', msg, namespace='/hwr')

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue", methods=['POST'])
def queue_set():
    queue = request.get_json()    

    for (sample_id, task_list) in queue.iteritems():
        sample_entry = add_sample(sample_id)

        for task in task_list:
            if task["parameters"]["Type"] == "DataCollection":
                add_data_collection(sample_entry, task["parameters"])
            elif task["parameters"]["Type"] == "Characterisation":
                add_characterisation(sample_entry, task["parameters"])

    print(Utils.queue_to_json(mxcube.queue.get_model_root()))
    return Utils.queue_to_json_response(mxcube.queue.get_model_root())


def add_sample(sample_loc):
    """
    """
    sample_model = qmo.Sample()
    sample_model.loc_str = sample_loc

    try:
        # Are we using the sample changer or is a sample put in the pin
        # manually
        if mxcube.diffractometer.use_sc:    # use sample changer
            basket_number, sample_number = sample_loc.split(':')
        else:
            basket_number, sample_number = (None, sample_loc)

        sample_model.location = (basket_number, sample_number)

    except AttributeError as ex:
        msg = '[QUEUE] sample could not be added, %s' % str(ex)
        logging.getLogger('HWR').error(msg)  

    mock_view = Mock()
    sample_entry = qe.SampleQueueEntry(mock_view, sample_model)
    mxcube.queue.add_child(mxcube.queue.get_model_root(), sample_model)
    mxcube.queue.queue_hwobj.enqueue(sample_entry)

    msg = "[QUEUE] sample %s added with queue id %s"
    logging.getLogger('HWR').info(msg % (sample_loc, sample_model._node_id))

    return sample_entry


def _create_dc(params):
    dc_model = qmo.DataCollection()
    dc_entry = qe.DataCollectionQueueEntry(Mock(), dc_model)
    acq = dc_model.acquisitions[0]

    acq.acquisition_parameters.set_from_dict(params)
    acq.path_template.set_from_dict(params)

    full_path = os.path.join(mxcube.session.get_base_image_directory(),
                             params.get('path', 'dummy_path'))

    acq.path_template.directory = full_path
                                               

    if mxcube.queue.check_for_path_collisions(acq.path_template):
        msg = "[QUEUE] data collection could not be added to sample: "
        msg += "path collision"
        logging.getLogger('HWR').exception(msg)
        # TODO: Raise error here

    # If there is a centered position associated with this data collection, get
    # the necessary data for the position and pass it to the collection.
    if int(params["point"]) > 0:
        for cpos in mxcube.diffractometer.savedCentredPos:
            if cpos['posId'] == int(params['point']):
                _cpos = qmo.CentredPosition(cpos['motor_positions'])
                _cpos.index = int(params['point'])
                acq.acquisition_parameters.centred_position = _cpos

    dc_entry.set_enabled(True)
    dc_model.set_enabled(True)

    return dc_entry, dc_model


def add_data_collection(sample_entry, params):
    """
    """
    dc_entry, dc_model = _create_dc(params)

    group_model = qmo.TaskGroup()
    group_model.set_enabled(True)
    mxcube.queue.add_child(sample_entry.get_data_model(), group_model)
    mxcube.queue.add_child(group_model,dc_model)
    
    group_entry = qe.TaskGroupQueueEntry(Mock(), group_model)
    group_entry.set_enabled(True)
    sample_entry.enqueue(group_entry)
    group_entry.enqueue(dc_entry)

    return dc_entry


@mxcube.route("/mxcube/api/v0.1/queue/<sample_id>", methods=['PUT'])
def update_sample(sample_id):
    '''
    Update a sample info
        :parameter node_id: entry identifier, integer. It can be a sample
            or a task within a sample
        :request Content-Type: application/json, object containing the
            parameter(s) to be updated, any parameter not sent will
            not be modified.
        :statuscode: 200: no error
        :statuscode: 409: sample info could not be updated, possibly because
            the given sample does not exist in the queue
    '''
    params = request.data
    params = json.loads(params)
    node_id = int(sample_id)

    sample_node = mxcube.queue.get_node(node_id)
    if sample_node:
        sample_entry = mxcube.queue.queue_hwobj.get_entry_with_model(sample_node)
        # TODO: update here the model with the new 'params'
        # missing lines...
        sample_entry.set_data_model(sample_node)
        Utils.save_queue(session)
        logging.getLogger('HWR').info('[QUEUE] sample updated')
        resp = jsonify({'QueueId': node_id})
        resp.status_code = 200
        return resp
    else:
        logging.getLogger('HWR').exception('[QUEUE] sample not in the queue, can not update')
        return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/queue/<node_id>/toggle", methods=['PUT'])
def toggle_node(node_id):
    '''
    Toggle a sample or a method checked status
        :parameter id: node identifier, integer
        :statuscode: 200: no error
        :statuscode: 409: node could not be toggled
    '''
    node_id = int(node_id)  # params['QueueId']
    node = mxcube.queue.get_node(node_id)
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
    # WARNING: serialize_queue_to_json() should only be used for sending to the client,
    # here on the back-end side we should just always use mxcube.queue !
    queue = serialize_queue_to_json()

    if isinstance(entry, qe.SampleQueueEntry):
        # this is a sample entry, thus, go through its checked children and toggle those
        if entry.is_enabled():
            entry.set_enabled(False)
            node.set_enabled(False)

        else:
            entry.set_enabled(True)
            node.set_enabled(True)

        new_state = entry.is_enabled()
        for elem in queue[node_id]['methods']:
            child_node = mxcube.queue.get_node(elem['QueueId'])
            child_entry = mxcube.queue.queue_hwobj.get_entry_with_model(child_node)
            if new_state:
                child_entry.set_enabled(True)
                child_node.set_enabled(True)
            else:
                child_entry.set_enabled(False)
                child_node.set_enabled(False)

    else:
        # not a sample so find the parent and toggle directly
        logging.getLogger('HWR').info('[QUEUE] toggling entry with id: %s' % node_id)
        parent_node = node.get_parent()  # this is a TaskGroup, so it is not in the parsed queue
        # go a level up,
        parent_node = parent_node.get_parent()  # this is a TaskGroup for a Char, a sampleQueueEntry if DataCol
        if isinstance(parent_node, qmo.TaskGroup):
            parent_node = parent_node.get_parent()
        parent = parent_node._node_id
        parent_entry = mxcube.queue.queue_hwobj.get_entry_with_model(parent_node)
        # now that we know the sample parent no matter what is the entry (char, dc)
        # check if the brother&sisters are enabled (and enable the parent)
        checked = 0

        for i in queue[parent]['methods']:
            if i['QueueId'] != node_id and i['checked'] == 1:  # at least one brother is enabled, no need to change parent
                checked = 1
                break
        if entry.is_enabled():
            entry.set_enabled(False)
            node.set_enabled(False)

        else:
            entry.set_enabled(True)
            node.set_enabled(True)

        new_state = entry.is_enabled()
        for met in queue[parent]['methods']:
            if int(met.get('QueueId')) == node_id:
                if new_state == 0 and checked == 0:
                    parent_entry.set_enabled(False)
                    parent_node.set_enabled(False)
                elif new_state == 1 and checked == 0:
                    parent_entry.set_enabled(True)
                    parent_node.set_enabled(True)
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/<node_id>", methods=['DELETE'])
def delete_sample_or_method(node_id):
    """
    Remove a sample or a method from the queue, if a sample is removes all of its children task will also be removed.
        :parameter node_id: node identifier
        :statuscode: 200: no error
        :statuscode: 409: node could not be deleted
    """
    node_to_remove = mxcube.queue.get_node(int(node_id))
    parent = node_to_remove.get_parent()
    mxcube.queue.del_child(parent, node_to_remove)
    entry_to_remove = mxcube.queue.queue_hwobj.get_entry_with_model(node_to_remove)
    if parent._node_id > 0:  # we are removing a method
        parent_entry = mxcube.queue.queue_hwobj.get_entry_with_model(parent)
        parent_entry.dequeue(entry_to_remove)
        parent = parent._node_id
        node_to_remove = node_to_remove._node_id
    else:
        # we are removing a sample, the parent of a sample is 'rootnode', which is not a Model
        mxcube.queue.queue_hwobj.dequeue(entry_to_remove)

    Utils.save_queue(session)

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/<sample_id>/<method_id>", methods=['DELETE'])
def delete_method(sample_id, method_id):
    """
    Remove a method from a sample in the queue.
        :parameter sampleid: node identifier for the sample, integer
        :parameter methodid: node identifier for the task to be deleted,
            integer
        :statuscode: 200: no error
        :statuscode: 409: node could not be deleted
    """
    node_to_remove = mxcube.queue.get_node(int(method_id))
    parent = mxcube.queue.get_node(int(sample_id))
    mxcube.queue.del_child(parent, node_to_remove)
    entry_to_remove = mxcube.queue.queue_hwobj.get_entry_with_model(node_to_remove)
    parent_entry = mxcube.queue.queue_hwobj.get_entry_with_model(parent)
    parent_entry.dequeue(entry_to_remove)
    Utils.save_queue(session)

    return Response(status=200)


# ##Adding methods to a sample
def add_centring(id):
    '''
    Add a centring task to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok,
        409 something bad happened. Plus:
       data ={ "CentringId": newId}
    '''
    params = request.get_json()
    logging.getLogger('HWR').info('[QUEUE] centring add requested with data: ' + str(params))

    cent_node = qmo.SampleCentring()
    cent_entry = qe.SampleCentringQueueEntry()
    cent_entry.set_data_model(cent_node)
    cent_entry.set_queue_controller(qm)
    node = mxcube.queue.get_node(int(id))
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
    entry._set_background_color = Mock()

    new_node = mxcube.queue.add_child_at_id(int(id), cent_node)  # add_child does not return id!
    entry.enqueue(cent_entry)

    logging.getLogger('HWR').info('[QUEUE] centring added to sample')

    Utils.save_queue(session)

    resp = jsonify({'QueueId': new_node,
                    'Type': 'Centring',
                    'Params': params})
    resp.status_code = 200
    return resp


def add_characterisation(sample_entry, params):
    """
    """
    refdc_entry, refdc_model = _create_dc(params)
    char_params = qmo.CharacterisationParameters.set_from_dict(params)

    charac_model = qmo.Characterisation(refdc_entry, char_params)
    charac_entry = qe.CharacterisationGroupQueueEntry(Mock(), charac_model)

    # A characterisation has two TaskGroups one for the reference collection
    # and one for the resulting diffraction plans.
    ref_group = qmo.TaskGroup()
    res_group = qmo.TaskGroup()
    ref_entry = qe.TaskGroupQueueEntry()
    res_entry = qe.TaskGroupQueueEntry()
    ref_entry.set_data_model(task_node1)
    res_entry.set_data_model(task_node2)

    node = mxcube.queue.get_node(int(id))  # this is a sampleNode
    # this is the corresponding sampleEntry
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)

    task1_id = mxcube.queue.add_child_at_id(int(id), task_node1)
    entry.enqueue(task1_entry)

    task2_id = mxcube.queue.add_child_at_id(task1_id, task_node2)
    task1_entry.enqueue(task2_entry)
    # add_child does not return id!
    new_node = mxcube.queue.add_child_at_id(task2_id, charac_node)
    task2_entry.enqueue(charac_entry)
    charac_entry.set_enabled(True)
    charac_node.set_enabled(True)
    logging.getLogger('HWR').info('[QUEUE] characterisation added to sample')

    Utils.save_queue(session)

    resp = jsonify({'QueueId': new_node, 'Type': 'Characterisation'})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['POST'])
def add_method(id):
    """
    Add a task to the given sample, the task type to add is specified
    in the request body.
        :parameter id: sample identifier, integer,
        :request Content-Type: application/json, object containing
            the parameter(s) of the task, it must also contain
            {'Type':{Centring | Characterisation | DataCollection}}
        :response Content-Type: application/json, object containing the
            task type plus it newly created node_id for it.
            Example: {'QueueId': 42, 'Type': 'DataCollection'}
        :statuscode: 200: no error
        :statuscode: 409: task could not be added to the sample
    """
    params = request.data
    params = json.loads(params)
    method_type = params['Type']
    node_id = id  # params['QueueId']

    if method_type == 'Centring':
        return add_centring(node_id)
    elif method_type == 'Characterisation':
        return add_characterisation(node_id)
    elif method_type == 'DataCollection':
        return add_data_collection(node_id)
    else:
        logging.getLogger('HWR').exception('[QUEUE] Method can not be added')
        return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/queue/<sample_id>/<method_id>", methods=['PUT'])
def update_method(sample_id, method_id):
    """
    Update the specifed task.
        :parameter sample_id: sample identifier, integer
        :parameter method_id: task identifier, integer
        :request Content-Type: application/json, object containing the
            parameter(s) of the task to be updated
        :statuscode: 200: no error
        :statuscode: 409: task could not be added to the sample
    """
    params = request.data
    params = json.loads(params)
#    sample_node = mxcube.queue.get_node(int(sample_id))
    method_node = mxcube.queue.get_node(int(method_id))
#    method_entry = mxcube.queue.queue_hwobj.get_entry_with_model(method_node)
    # TODO: update fields here, I would say that the entry does not need to be updated, only the model node

    if isinstance(method_node, qmo.DataCollection):
        method_node.acquisitions[0].acquisition_parameters.set_from_dict(params)
    elif isinstance(method_node, qmo.Characterisation):
        method_node.reference_image_collection.acquisitions[0].acquisition_parameters.set_from_dict(params)
        for k, v in params.items():
            if hasattr(method_node.characterisation_parameters, k):
                setattr(method_node.characterisation_parameters, k, v)
    elif isinstance(method_node, qmo.SampleCentring):
        pass

    Utils.save_queue(session)

    logging.getLogger('HWR').info('[QUEUE] method updated')
    resp = jsonify({'QueueId': method_id})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/dc", methods=['GET'])
def get_default_dc_params():
    """
    returns the default values for an acquisition (data collection).
    TODO: implement as_dict in the qmo.AcquisitionParameters
    """
    acq_parameters = mxcube.beamline.get_default_acquisition_parameters()
    resp = jsonify({
        'first_image': acq_parameters.first_image,
        'num_images': acq_parameters.num_images,
        'osc_start': acq_parameters.osc_start,
        'osc_range': acq_parameters.osc_range,
        'kappa': acq_parameters.kappa,
        'kappa_phi': acq_parameters.kappa_phi,
        'overlap': acq_parameters.overlap,
        'exp_time': acq_parameters.exp_time,
        'num_passes': acq_parameters.num_passes,
        'resolution': acq_parameters.resolution,
        'energy': acq_parameters.energy,
        'transmission': acq_parameters.transmission,
        'shutterless': acq_parameters.shutterless,
        'detector_mode': acq_parameters.detector_mode,
        'inverse_beam': False,
        'take_dark_current': True,
        'skip_existing_images': False,
        'take_snapshots': True
        })
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/char", methods=['GET'])
def get_default_char_params():
    """
    returns the default values for a characterisation.
    """
    resp = jsonify(mxcube.beamline.get_default_characterisation_parameters().as_dict())
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['GET'])
def get_sample(id):
    """
    Get the information of the given sample.
        :parameter id: sample identifier, integer
        :response Content-Type: application/json, object containing the
            parameter(s) of the sample. Example without parameters
            {"QueueId": 22, "SampleId": "3:02", "methods": []}
        :statuscode: 200: no error
        :statuscode: 409: sample could not be retrieved
    """
    # WARNING: serialize_queue_to_json() should only be used for sending to the client,
    # here on the back-end side we should just always use mxcube.queue !
    queue = serialize_queue_to_json()

    if not queue[int(id)]:
        logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
        return Response(status=409)
    else:
        resp = jsonify(queue[int(id)])
        resp.status_code = 200
        return resp


@mxcube.route("/mxcube/api/v0.1/queue/<sample_id>/<int:method_id>", methods=['GET'])
def get_method(sample_id, method_id):
    """
    Get the information of the given task, beloging to the given sample
        :parameter sampleid: sample identifier, integer
        :parameter methodid: task identifier, integer
        :response Content-Type: application/json, object containing the
            parameter(s) of the task. Example without parameters
            {"QueueId": 52,  "Type": 'Centring'...}
        :statuscode: 200: no error
        :statuscode: 409: task could not be added to the sample
    """
    # WARNING: serialize_queue_to_json() should only be used
    # for sending to the client,
    # here on the back-end side we should just always use mxcube.queue !
    queue = serialize_queue_to_json()

    if not queue[int(sample_id)]:
        logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
        return Response(status=409)
    else:
        methods = queue[int(sample_id)]['methods']
        # find the required one
        for met in methods:
            if met['QueueId'] == int(method_id):
                resp = jsonify(met)
                resp.status_code = 200
                return resp
    logging.getLogger('HWR').exception('[QUEUE] method info could not be retrieved, it does not exits for the given sample')
    return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/queue/json", methods=["GET"])
def serialize():
    try:
        return Response(response=jsonpickle.encode(mxcube.queue), status=200,
                        mimetype="application/json")
    except Exception:
        logging.getLogger("HWR").exception("[QUEUE] cannot serialize")
        return Response(status=409)


def serialize_queue_to_json():
    """
      {
      "1": {
        "QueueId": 1,
        "SampleId": "1:01",
        "checked": 0,
        "methods": []
          }
       }
    """
    jsonobj = jsonpickle.encode(mxcube.queue)
    queue_entry_list = json.loads(jsonobj)['py/state']['_HardwareObjectNode__objects'][0][0]['py/state']['_queue_entry_list']

    try:
        parent = queue_entry_list[0]['py/state']['_data_model']['_parent']
        # is it always the first entry?
    except Exception:
        return {}  # empty queue
    i = 1
    for entry in queue_entry_list[1:]:
        if entry['py/state']['_data_model'].has_key('_node_id'):
            pass
        else:
            entry['py/state']['_data_model'] = parent['_children'][i]
        i += 1
    # now we can iterate since the queue_entry_list has all the data models

    aux = {}
    for sampEntry in queue_entry_list:
        data_model = sampEntry['py/state']['_data_model']
        aux[data_model['_node_id']] = {"QueueId": data_model['_node_id'],
                                       "SampleId": data_model['loc_str'],
                                       "checked": data_model['_enabled'],
                                       "methods": []}

        children = data_model['_children']
        for child in children:
            if child['py/object'].split('.')[1] == 'TaskGroup':
                # keep going down
                for grandChild in child['_children']:
                    if grandChild['py/object'].split('.')[1] == 'TaskGroup':
                        # keep going down one more time for the Char
                        for grandGrandChild in grandChild['_children']:
                            if grandGrandChild['py/object'].split('.')[1] == 'Characterisation':
                                aux[data_model['_node_id']]['methods'].append({'QueueId': grandGrandChild['_node_id'], 'Type': 'Characterisation', 'Params': grandGrandChild['characterisation_parameters'], 'AcquisitionParams': grandGrandChild['reference_image_collection']['acquisitions'][0]['acquisition_parameters'], 'checked': data_model['_enabled'], 'executed': grandChild['_executed'], 'html_report': ''})  # grandGrandChild['characterisation_parameters']
                    elif grandChild['py/object'].split('.')[1] == 'DataCollection':
                        aux[data_model['_node_id']]['methods'].append({'QueueId': grandChild['_node_id'], 'Type': 'DataCollection', 'Params': {}, 'checked': data_model['_enabled'], 'executed': grandChild['_executed'], 'Params': grandChild['acquisitions'][0]['acquisition_parameters']})
                    # acq limited for now to only one element of the array, so
                    # a DataCollection entry only has a single Acquisition ,
                    # done like this to simplify devel... just belean!
    return aux
