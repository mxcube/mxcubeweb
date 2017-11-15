import re
import json
import logging
import signals

import queue_model_objects_v1 as qmo
import queue_entry as qe
import QueueManager

from flask import Response, jsonify, request, session
from mxcube3 import app as mxcube
from mxcube3 import socketio
import qutils
import scutils

qm = QueueManager.QueueManager('Mxcube3')


@mxcube.route("/mxcube/api/v0.1/queue/start", methods=['PUT'])
def queue_start():
    """
    Start execution of the queue.

    :returns: Respons object, status code set to:
              200: On success
              409: Queue could not be started
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to start')

    try:
        queue = qutils.queue_to_dict()
        sample_id = queue["sample_order"][0]

        # If auto mount sample is false, just run the first one
        if not qutils.get_auto_mount_sample():
            sid = scutils.get_current_sample() or sample_id
            qutils.execute_entry_with_id(sid)
        else:
            # Making sure all sample entries are enabled before running the queue
            qutils.enable_sample_entries(queue["sample_order"], True)
            mxcube.queue.queue_hwobj.set_pause(False)
            mxcube.queue.queue_hwobj.execute()

    except Exception as ex:
        signals.queue_execution_failed(ex)

    logging.getLogger('HWR').info('[QUEUE] Queue started')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/stop", methods=['PUT'])
def queue_stop():
    """
    Stop execution of the queue.

    :returns: Response object status code set to:
              200: On success
              409: Queue could not be stopped
    """

    if mxcube.queue.queue_hwobj._root_task is not None:
        mxcube.queue.queue_hwobj.stop()
    else:
        qe = mxcube.queue.queue_hwobj.get_current_entry()
        # check if a node/tas is executing and stop that one
        try:
            qe.stop()
        except Exception as ex:
            print 'exception...', ex

        logging.getLogger('user_level_log').info('Queue execution was aborted, ' + str(qe.get_data_model()))

        mxcube.queue.queue_hwobj.set_pause(False)
        # the next two is to avoid repeating the task
        # TODO: if you now run the queue it will be enabled and run
        qe.get_data_model().set_executed(True)
        qe.get_data_model().set_enabled(False)
        qe._execution_failed = True

        mxcube.queue.queue_hwobj._is_stopped = True
        signals.queue_execution_stopped()
        signals.collect_oscillation_failed()

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/abort", methods=['PUT'])
def queue_abort():
    """
    Abort execution of the queue.

    :returns: Response object, status code set to:
              200 On success
              409 queue could not be aborted
    """
    mxcube.queue.queue_hwobj.stop()
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/pause", methods=['PUT'])
def queue_pause():
    """
    Pause the execution of the queue

    :returns: Response object, status code set to:
              200: On success
              409: Queue could not be paused
    """
    mxcube.queue.queue_hwobj.pause(True)
    msg = {'Signal': qutils.queue_exec_state(),
           'Message': 'Queue execution paused',
           'State': 1}
    socketio.emit('queue', msg, namespace='/hwr')
    logging.getLogger('HWR').info('[QUEUE] Paused')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/unpause", methods=['PUT'])
def queue_unpause():
    """
    Unpause execution of the queue

    :returns: Response object, status code set to:
              200: On success
              409: Queue could not be unpause
    """
    mxcube.queue.queue_hwobj.pause(False)
    msg = {'Signal': qutils.queue_exec_state(),
           'Message': 'Queue execution started',
           'State': 1}
    socketio.emit('queue', msg, namespace='/hwr')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/clear", methods=['PUT', 'GET'])
def queue_clear():
    """
    Clear the queue.

    :returns: Response object, status code set to:
              200: On success
              409: Queue could not be started
    """
    mxcube.diffractometer.savedCentredPos = []
    mxcube.queue = qutils.new_queue()
    logging.getLogger('HWR').info('[QUEUE] Cleared  ' +
                                  str(mxcube.queue.get_model_root()._name))
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue", methods=['GET'])
def queue_get():
    """
    Get the queue
    :returns: Response object response Content-Type: application/json, json
              object containing the queue on the format returned by
              queue_to_json_response. The status code is set to:

              200: On success
              409: On error, could not retrieve queue
    """
    logging.getLogger('HWR').info('[QUEUE] queue_get called')
    resp = qutils.queue_to_json_response()
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue_state", methods=['GET'])
def queue_get_state():
    """
    Get the queue.

    :returns: Response object response Content-Type: application/json, json
              object containing the queue state. The status code is set to:

              200: On success
              409: On error, could not retrieve queue
    """
    logging.getLogger('HWR').info('[QUEUE] queue_get called')
    resp = jsonify(qutils.get_queue_state())
    resp.status_code = 200
    return resp



@mxcube.route("/mxcube/api/v0.1/queue/<sid>/<tindex>/execute", methods=['PUT'])
def execute_entry_with_id(sid, tindex):
    """
    Execute the entry at position (sampleID, task index) in queue
    :param str sid: sampleID
    :param int tindex: task index of task within sample with id sampleID

    :statuscode: 200, no error
                 409, queue entry could not be executed
    """
    try:
        qutils.execute_entry_with_id(sid, tindex)                
    except:
        return Response(status=409)
    else:
#       logging.getLogger('HWR').info('[QUEUE] is:\n%s ' % qutils.queue_to_json())
        return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue", methods=['PUT'])
def set_queue():
    # Clear queue
    mxcube.diffractometer.savedCentredPos = []
    mxcube.queue = qutils.new_queue()

    # Set new queue
    qutils.queue_add_item(request.get_json())
 #  logging.getLogger('HWR').info('[QUEUE] is:\n%s ' % qutils.queue_to_json())
    qutils.save_queue(session)

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue", methods=['POST'])
def queue_add_item():
    tasks = request.get_json()
    queue = qutils.queue_add_item(tasks, use_queue_cache=True)
    resp = jsonify(queue)
    resp.status_code = 200

    return resp


@mxcube.route("/mxcube/api/v0.1/queue/<sid>/<tindex>", methods=['POST'])
def queue_update_item(sid, tindex):
    data = request.get_json()
    current_queue = qutils.queue_to_dict()

    if tindex in ['undefined']:
        node_id = current_queue[sid]["queueID"]
    else:
        node_id = current_queue[sid]["tasks"][int(tindex)]["queueID"]

    model, entry = qutils.get_entry(node_id)
    sample_model, sample_entry = qutils.get_entry(sid)

    if data["type"] == "DataCollection":
        qutils.set_dc_params(model, entry, data, sample_model)
    elif data["type"] == "Characterisation":
        qutils.set_char_params(model, entry, data, sample_model)

    logging.getLogger('HWR').info('[QUEUE] is:\n%s ' % qutils.queue_to_json())

    resp = qutils.queue_to_json_response([model])
    resp.status_code = 200

    return resp


@mxcube.route("/mxcube/api/v0.1/queue/delete", methods=['POST'])
def queue_delete_item():
    item_pos_list = request.get_json()
    qutils.delete_entry_at(item_pos_list)
    logging.getLogger('HWR').info('[QUEUE] is:\n%s ' % qutils.queue_to_json())
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/<sid>/<ti1>/<ti2>/swap", methods=['POST'])
def queue_swap_task_item(sid, ti1, ti2):
    qutils.swap_task_entry(sid, int(ti1), int(ti2))
    logging.getLogger('HWR').info('[QUEUE] is:\n%s ' % qutils.queue_to_json())
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/<sid>/<ti1>/<ti2>/move", methods=['POST'])
def queue_move_task_item(sid, ti1, ti2):
    qutils.move_task_entry(sid, int(ti1), int(ti2))
    logging.getLogger('HWR').info('[QUEUE] is:\n%s ' % qutils.queue_to_json())
    return Response(status=200)


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
        # qutils.save_queue(session)
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
    queue = qutils.queue_to_dict()

    if isinstance(entry, qe.SampleQueueEntry):
        # this is a sample entry, thus, go through its checked children and toggle those
        if entry.is_enabled():
            entry.set_enabled(False)
            node.set_enabled(False)
        else:
            entry.set_enabled(True)
            node.set_enabled(True)

        new_state = entry.is_enabled()
        for elem in queue[node_id]:
            child_node = mxcube.queue.get_node(elem['queueID'])
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

        for i in queue[parent]:
            if i['queueID'] != node_id and i['checked'] == 1:  # at least one brother is enabled, no need to change parent
                checked = 1
                break
        if entry.is_enabled():
            entry.set_enabled(False)
            node.set_enabled(False)

        else:
            entry.set_enabled(True)
            node.set_enabled(True)

        new_state = entry.is_enabled()
        for met in queue[parent]:
            if int(met.get('queueID')) == node_id:
                if new_state == 0 and checked == 0:
                    parent_entry.set_enabled(False)
                    parent_node.set_enabled(False)
                elif new_state == 1 and checked == 0:
                    parent_entry.set_enabled(True)
                    parent_node.set_enabled(True)

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
    entry._set_background_color = qutils.PMock()

    new_node = mxcube.queue.add_child_at_id(int(id), cent_node)  # add_child does not return id!
    entry.enqueue(cent_entry)

    logging.getLogger('HWR').info('[QUEUE] centring added to sample')

    resp = jsonify({'QueueId': new_node,
                    'Type': 'Centring',
                    'Params': params})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/dc", methods=['GET'])
def get_default_dc_params():
    """
    returns the default values for an acquisition (data collection).
    TODO: implement as_dict in the qmo.AcquisitionParameters
    """
    acq_parameters = mxcube.beamline.get_default_acquisition_parameters()
    ftype = mxcube.beamline.detector_hwobj.getProperty('file_suffix')
    ftype = ftype if ftype else '.?'
    n = int(mxcube.session["file_info"].getProperty("precision", 4))
    template = '`${prefix}_${position}_[RUN]_%s.%s`' % (n * '#', ftype)

    resp = jsonify({
        'acq_parameters': {
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
            'take_snapshots': True,
            'helical': False,
            'mesh': False,
            'fileNameTemplate': template
        },
        'limits': mxcube.beamline.get_acquisition_limit_values()
    })

    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/char_acq", methods=['GET'])
def get_default_char_acq_params():
    """
    returns the default values for a characterisation acquisition.
    TODO: implement as_dict in the qmo.AcquisitionParameters
    """
    acq_parameters = mxcube.beamline.get_default_char_acq_parameters()
    ftype = mxcube.beamline.detector_hwobj.getProperty('file_suffix')
    ftype = ftype if ftype else '.?'
    n = int(mxcube.session["file_info"].getProperty("precision", 4))
    template = '`${prefix}_${position}_[RUN]_%s.%s`' % (n * '#', ftype)

    resp = jsonify({
        'acq_parameters': {
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
            'shutterless': False,
            'detector_mode': acq_parameters.detector_mode,
            'inverse_beam': False,
            'take_dark_current': True,
            'skip_existing_images': False,
            'take_snapshots': True,
            'fileNameTemplate': template,
            'strategy_complexity': 'FEW',
            'account_rad_damage': True,
            'opt_sad': False,
            'min_crystal_vdim': 0.05,
            'max_crystal_vdim': 0.05,
            'min_crystal_vphi': 0,
            'max_crystal_vphi': 90,
            
        },
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

@mxcube.route("/mxcube/api/v0.1/queue/mesh", methods=['GET'])
def get_default_mesh_params():
    """
    returns the default values for a mesh.
    """
    acq_parameters = mxcube.beamline.get_default_acquisition_parameters('default_mesh_values')
    resp = jsonify({
        'acq_parameters': {
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
            'take_snapshots': True,
            'cell_counting': mxcube.beamline['default_mesh_values'].getProperty('cell_counting', 'zig-zag'),
            'cell_spacing': mxcube.beamline['default_mesh_values'].getProperty('cell_spacing', 'None'),

        },
        })    
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
    sample = qutils.queue_to_dict().get(int(id), None)

    if not sample:
        logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
        return Response(status=409)
    else:
        resp = jsonify(sample)
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
    sample = qutils.queue_to_dict().get(int(id), None)

    if not sample:
        msg = "[QUEUE] sample info could not be retrieved"
        logging.getLogger('HWR').error(msg)
        return Response(status=409)
    else:
        # Find task with queue id method_id
        for task in sample.tasks:
            if task['queueID'] == int(method_id):
                resp = jsonify(task)
                resp.status_code = 200
                return resp

    msg = "[QUEUE] method info could not be retrieved, it does not exits for"
    msg += " the given sample"

    logging.getLogger('HWR').exception(msg)
    return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/queue/json", methods=["GET"])
def serialize():
    try:
        return qutils.queue_to_json_response()
    except Exception:
        logging.getLogger("HWR").exception("[QUEUE] cannot serialize")
        return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/queue/automount", methods=["POST"])
def set_autmount():
    automount = request.get_json()
    qutils.set_auto_mount_sample(automount)
    resp = jsonify({'automount': automount})
    resp.status_code = 200

    return resp


@mxcube.route("/mxcube/api/v0.1/queue/num_snapshots", methods=["PUT"])
def set_num_snapshots():
    data = request.get_json()
    mxcube.NUM_SNAPSHOTS = data.get("numSnapshots", 4)
    resp = jsonify({'numSnapshots': data.get("numSnapshots", 4)})
    resp.status_code = 200

    return resp


@mxcube.route("/mxcube/api/v0.1/queue/group_folder", methods=["POST"])
def set_group_folder():
    data = request.get_json()

    path = data.get('path','')

    if path and path[0] in ["/", "."]:
        path = path[1:]

    if path and path[-1] != "/":
        path += "/"

    path = "".join([c for c in path if re.match(r"^[a-zA-Z0-9_/-]*$", c)])

    mxcube.session.set_user_group(path)
    root_path = mxcube.session.get_base_image_directory()
    resp = jsonify({'path': path, 'rootPath': root_path});
    resp.status_code = 200

    return resp


@mxcube.route("/mxcube/api/v0.1/queue/group_folder", methods=["GET"])
def get_group_folder():
    resp = jsonify({'path': mxcube.session.get_group_name()});
    resp.status_code = 200

    return resp


@mxcube.route("/mxcube/api/v0.1/queue/auto_add_diffplan", methods=["POST"])
def set_autoadd():
    autoadd = request.get_json()
    qutils.set_auto_add_diffplan(autoadd)
    resp = jsonify({'auto_add_diffplan': autoadd})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/queue/mock/diff_plan/<sid>", methods=["GET"])
def create_diff_plan(sid):
    '''Juts for creating a diff plan as if it were created by edna and so on.
    '''
    from mock import Mock

    acq_parameters = mxcube.beamline.get_default_acquisition_parameters()
    ftype = mxcube.beamline.detector_hwobj.getProperty('fileSuffix')
    ftype = ftype if ftype else '.?'
    n = int(mxcube.session["file_info"].getProperty("precision", 4))
    template = '`${prefix}_${position}_[RUN]_%s.%s`' % (n * '#', ftype)

    task = { 'parameters': {
            'first_image': acq_parameters.first_image,
            'num_images': 111,
            'osc_start': acq_parameters.osc_start,
            'osc_range': 42,
            'kappa': acq_parameters.kappa,
            'kappa_phi': acq_parameters.kappa_phi,
            'overlap': acq_parameters.overlap,
            'exp_time': 456,
            'num_passes': acq_parameters.num_passes,
            'resolution': acq_parameters.resolution,
            'energy': acq_parameters.energy,
            'transmission': acq_parameters.transmission,
            'shutterless': acq_parameters.shutterless,
            'detector_mode': acq_parameters.detector_mode,
            'inverse_beam': False,
            'take_dark_current': True,
            'skip_existing_images': False,
            'take_snapshots': True,
            'helical': False,
            'mesh': False,
            'fileNameTemplate': template,
            'prefix': 'foo',
            'shape': 'P1'#-1
        },
        'checked': {True}
    }

    sample_model, sample_entry = qutils.get_entry(sid)
    dc_model, dc_entry = qutils._create_dc(task)    
    qutils.set_dc_params(dc_model, dc_entry, task, sample_model)
    pt = dc_model.acquisitions[0].path_template

    if mxcube.queue.check_for_path_collisions(pt):
        msg = "[QUEUE] data collection could not be added to sample: "
        msg += "path collision"
        raise Exception(msg)

    dc_model.set_origin(3)
    dc_model.set_enabled(False)

    char, char_entry = qutils.get_entry(3)

    char.diffraction_plan.append([dc_model])
    mxcube.queue.emit('diff_plan_available',
                                (char,
                                 char.diffraction_plan.index([dc_model]),
                                 dc_model)
                                )

    return Response(status=200)
