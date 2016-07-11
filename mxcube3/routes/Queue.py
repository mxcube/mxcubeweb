from mxcube3 import app as mxcube
from mxcube3 import socketio
from flask import session, request, Response, jsonify
from .Utils import *
import time
import logging
import collections
import gevent.event
import os, sys
import json
import queue_model_objects_v1 as qmo
import QueueManager
#for mocking the view of the queue, easier than adding sth like if not view:
from HardwareRepository.BaseHardwareObjects import Null as Mock #mock import Mock
import signals
import Utils
import types
import queue_entry as qe
from queue_entry import QueueEntryContainer
import jsonpickle
qm = QueueManager.QueueManager('Mxcube3')
#qm._QueueManager__execute_entry = types.MethodType(Utils.__execute_entry, qm)

def init_signals(queue):
    for signal in signals.collectSignals:
        mxcube.collect.connect(mxcube.collect, signal, signals.task_event_callback)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationStarted', signals.collectOscillationStarted)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationFailed', signals.collectOscillationFailed)
    mxcube.collect.connect(mxcube.collect, 'collectOscillationFinished', signals.collectOscillationFinished)
    queue.lastQueueNode = {'id':0, 'sample':'0:0'}

# ##----QUEUE ACTIONS----##
@mxcube.route("/mxcube/api/v0.1/queue/start", methods=['PUT'])
def queueStart():
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
def queueStop():
    """
    Stop execution of the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be stopped
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to stop')
    global queue_has_to_be_stopped
    queue_has_to_be_stopped = True
    mxcube.queue.queue_hwobj.stop()
    logging.getLogger('HWR').info('[QUEUE] Queue stopped')
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/abort", methods=['PUT'])
def queueAbort():
    """
    Abort execution of the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be aborted
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to abort')
    mxcube.queue.queue_hwobj.stop()
    logging.getLogger('HWR').info('[QUEUE] Queue aborted')
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/pause", methods=['PUT'])
def queuePause():
    """
    Pause the execution of the queue
        :statuscode: 200: no error
        :statuscode: 409: queue could not be paused
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to pause')
    mxcube.queue.queue_hwobj.pause(True)
    msg = {'Signal': 'QueuePaused','Message': 'Queue execution paused', 'State':1}
    socketio.emit('Queue', msg, namespace='/hwr')
    logging.getLogger('HWR').info('[QUEUE] Queue paused')
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/unpause", methods=['PUT'])
def queueUnpause():
    """
    Unpause execution of the queue
        :statuscode: 200: no error
        :statuscode: 409: queue could not be unpause
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to unpause')
    mxcube.queue.queue_hwobj.pause(False)
    msg = {'Signal': 'QueueStarted','Message': 'Queue execution started', 'State':1}
    socketio.emit('Queue', msg, namespace='/hwr')
    logging.getLogger('HWR').info('[QUEUE] Queue unpaused')
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/clear", methods=['PUT'])
def queueClear():
    """
    Clear the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be started
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to clear')

    mxcube.diffractometer.savedCentredPos = []
    mxcube.queue = Utils.new_queue() # maybe we can just clear the queue object itself instead
    Utils.save_queue(session)
    logging.getLogger('HWR').info('[QUEUE] Queue cleared  '+ str(mxcube.queue.get_model_root()._name))
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue", methods=['GET'])
def queueGet():
    """
    Get the queue.
        :response Content-Type: application/json, an object containing queue entries (sample with the associated children   tasks plus their parameters)
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
    resp = jsonify(serializeQueueToJson())
    resp.status_code = 200
    return resp

@mxcube.route("/mxcube/api/v0.1/queue/<int:nodeId>/execute", methods=['PUT'])
def executeEntryWithId(nodeId):
    """
    Execute the given queue entry
        :parameter nodeId: entry identifier, integer. It can be a sample or a task within a sample
        :statuscode: 200: no error, the given entry was sent to execution (any further error might still happen)
        :statuscode: 409: queue entry could not be executed
    """
    lastQueueNode = mxcube.queue.lastQueueNode
    ## WARNING: serializeQueueToJson() should only be used for sending to the client,
    ## here on the back-end side we should just always use mxcube.queue !
    queue = serializeQueueToJson() 
    global queue_has_to_be_stopped
    queue_has_to_be_stopped = False 
    
    node = mxcube.queue.get_node(nodeId)
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)

    msg = {'Signal': 'QueueStarted','Message': 'Queue execution started', 'State':1}
    socketio.emit('Queue', msg, namespace='/hwr')

    mxcube.queue.queue_hwobj.set_pause(False)
    if isinstance(entry, qe.SampleQueueEntry):
        logging.getLogger('HWR').info('[QUEUE] Queue going to execute sample entry with id: %s' % nodeId)
        #this is a sample entry, thus, go through its checked children and execute those
        for elem in queue[nodeId]['methods']:
            if queue_has_to_be_stopped: break
        for elem in queue[nodeId]['methods']:
            if int(elem['checked']) == 1:
                logging.getLogger('HWR').info('[QUEUE] Queue executing children entry with id: %s' % elem['QueueId'])
                childNode = mxcube.queue.get_node(elem['QueueId'])
                childEntry = mxcube.queue.queue_hwobj.get_entry_with_model(childNode)
                childEntry._view = Mock()  # associated text deps
                childEntry._set_background_color = Mock()  # widget color deps
                try:
                    if mxcube.queue.queue_hwobj.is_paused():
                        logging.getLogger('HWR').info('[QUEUE] Cannot execute, queue is paused. Waiting for unpause')
                        msg = {'Signal': 'QueuePaused','Message': 'Queue execution paused', 'State':1} # 1: started
                        socketio.emit('Queue', msg, namespace='/hwr')
                        mxcube.queue.queue_hwobj.wait_for_pause_event()
                    mxcube.queue.lastQueueNode.update({'id': elem['QueueId'], 'sample': queue[nodeId]['SampleId']})
                    #mxcube.queue.queue_hwobj.execute_entry = types.MethodType(Utils.my_execute_entry, mxcube.queue.queue_hwobj)
                    mxcube.queue.queue_hwobj.execute_entry(childEntry)
                    childEntry.set_enabled(False)
                except Exception:
                    logging.getLogger('HWR').exception('[QUEUE] Queue error executing child entry with id: %s' % elem['QueueId'])
    else:
        #not a sample so execute directly
        logging.getLogger('HWR').info('[QUEUE] Queue executing entry with id: %s' % nodeId)
        if mxcube.queue.queue_hwobj.is_paused():
            logging.getLogger('HWR').info('[QUEUE] Cannot execute, queue is paused. Waiting for unpause')
            msg = {'Signal': 'QueuePaused','Message': 'Queue execution paused', 'State':1}
            socketio.emit('Queue', msg, namespace='/hwr')
            mxcube.queue.queue_hwobj.wait_for_pause_event()

        entry._view = Mock()  # associated text deps
        entry._set_background_color = Mock()  # widget color deps
        #parent = int(node.get_parent()._node_id)
        parentNode = node.get_parent() # this is a TaskGroup, so it is not in the parsed queue
        # go a level up,
        parentNode = parentNode.get_parent() # this is a TaskGroup for a Char, a sampleQueueEntry if DataCol
        if isinstance(parentNode, qmo.TaskGroup):
            parentNode = parentNode.get_parent()
        parent = int(parentNode._node_id)

        mxcube.queue.lastQueueNode.update({'id': nodeId, 'sample': queue[parent]['SampleId']})
        #mxcube.queue.queue_hwobj.execute_entry = types.MethodType(Utils.my_execute_entry, mxcube.queue.queue_hwobj)
        mxcube.queue.queue_hwobj.execute_entry(entry)
        entry.set_enabled(False)

    msg = {'Signal': 'QueueStopped','Message': 'Queue execution stopped', 'State':1}
    socketio.emit('Queue', msg, namespace='/hwr')

    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue", methods=['POST'])
def addSample():
    '''
    Add a sample to the queue.
        :request Content-Type: application/json, {"SampleId": sampleId}, where sampleId is sample location (eg '1:01')
        :response Content-Type: application/json, {"QueueId": node_id, "SampleId": sampleId}, where sampleId is the same as the caller id (eg '1:01') and node_id an integer which is used for refering to this element from now onwards.
        :statuscode: 200: no error
        :statuscode: 409: sample could not be added, possibly because it already exist in the queue
        :example request:   * POST http://host:port/mxcube/api/v0.1/queue 
                            * Content-Type: application/json  
                            * {"SampleId": "1:07"}
  
    '''
    params = request.data
    params = json.loads(params)
    sampleId = params['SampleId']

    sampleNode = qmo.Sample()
    sampleNode.loc_str = sampleId
    sampleNode.lims_id = None
    sampleNode.lims_group_id = None
    basket_number=None

    if mxcube.diffractometer.use_sc:    # use sample changer
        basket_number, sample_number = sampleId.split(':')
    else:
        sample_number = sampleId

    sampleNode.location = (basket_number, sample_number)
    sampleEntry = qe.SampleQueueEntry()
    sampleEntry.set_data_model(sampleNode)
    sampleEntry.set_queue_controller(qm)
    sampleEntry._view = Mock()
    sampleEntry._set_background_color = Mock()

    ## WARNING: serializeQueueToJson() should only be used for sending to the client,
    ## here on the back-end side we should just always use mxcube.queue !
    queue = serializeQueueToJson()
    for i in queue:
        if queue[i]['SampleId'] == sampleId:
            logging.getLogger('HWR').error('[QUEUE] sample could not be added, already in the queue')
            return Response(status=409)
    
    mxcube.queue.add_child(mxcube.queue._selected_model, sampleNode)
    nodeId = sampleNode._node_id
    mxcube.queue.queue_hwobj.enqueue(sampleEntry)
    logging.getLogger('HWR').info('[QUEUE] sample "%s" added with queue id "%s"' %(sampleId, nodeId))
    #queue.update({nodeId: {'SampleId': sampleId, 'QueueId': nodeId, 'checked': 0, 'methods': []}})
    Utils.save_queue(session)
    return jsonify({'SampleId': sampleId, 'QueueId': nodeId})
    
@mxcube.route("/mxcube/api/v0.1/queue/<sampleId>", methods=['PUT'])
def updateSample(sampleId):
    '''
    Update a sample info
        :parameter nodeId: entry identifier, integer. It can be a sample or a task within a sample
        :request Content-Type: application/json, object containing the parameter(s) to be updated, any parameter not sent will not be modified.
        :statuscode: 200: no error
        :statuscode: 409: sample info could not be updated, possibly because the given sample does not exist in the queue
    '''
    params = request.data
    params = json.loads(params)
    nodeId = int(sampleId)

    sampleNode = mxcube.queue.get_node(nodeId)
    if sampleNode:
        sampleEntry = mxcube.queue.queue_hwobj.get_entry_with_model(sampleNode)
        #TODO: update here the model with the new 'params'
        ### missing lines...
        sampleEntry.set_data_model(sampleNode)
        Utils.save_queue(session)
        logging.getLogger('HWR').info('[QUEUE] sample updated')
        resp = jsonify({'QueueId': nodeId})
        resp.status_code = 200
        return resp
    else:
        logging.getLogger('HWR').exception('[QUEUE] sample not in the queue, can not update')
        return Response(status=409)
    
@mxcube.route("/mxcube/api/v0.1/queue/<id>/toggle", methods=['PUT'])
def toggleNode(id):
    '''
    Toggle a sample or a method checked status
        :parameter id: node identifier, integer
        :statuscode: 200: no error
        :statuscode: 409: node could not be toggled
    '''
    nodeId = int(id)  # params['QueueId']
    node = mxcube.queue.get_node(nodeId)
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
    ## WARNING: serializeQueueToJson() should only be used for sending to the client,
    ## here on the back-end side we should just always use mxcube.queue !
    queue = serializeQueueToJson()

    if isinstance(entry, qe.SampleQueueEntry):
        #this is a sample entry, thus, go through its checked children and toggle those
        if entry.is_enabled():
            entry.set_enabled(False)
            node.set_enabled(False)

        else:
            entry.set_enabled(True)
            node.set_enabled(True)

        new_state = entry.is_enabled()
        for elem in queue[nodeId]['methods']:              
            childNode = mxcube.queue.get_node(elem['QueueId'])
            childEntry = mxcube.queue.queue_hwobj.get_entry_with_model(childNode)
            if new_state:
                childEntry.set_enabled(True)
                childNode.set_enabled(True)
            else:
                childEntry.set_enabled(False)
                childNode.set_enabled(False)

    else:
        #not a sample so find the parent and toggle directly
        logging.getLogger('HWR').info('[QUEUE] toggling entry with id: %s' % nodeId)
        parentNode = node.get_parent() # this is a TaskGroup, so it is not in the parsed queue
        # go a level up,
        parentNode = parentNode.get_parent() # this is a TaskGroup for a Char, a sampleQueueEntry if DataCol
        if isinstance(parentNode, qmo.TaskGroup):
            parentNode = parentNode.get_parent()
        parent = parentNode._node_id
        parentEntry = mxcube.queue.queue_hwobj.get_entry_with_model(parentNode)
        #now that we know the sample parent no matter what is the entry (char, dc)
        #check if the brother&sisters are enabled (and enable the parent)
        checked = 0

        for i in queue[parent]['methods']:
            if i['QueueId'] != nodeId and i['checked'] == 1: # at least one brother is enabled, no need to change parent
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
            if int(met.get('QueueId')) == nodeId:
                if new_state == 0 and checked == 0:
                    parentEntry.set_enabled(False)
                    parentNode.set_enabled(False)
                elif new_state == 1 and checked == 0:
                    parentEntry.set_enabled(True)
                    parentNode.set_enabled(True)
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['DELETE'])
def deleteSampleOrMethod(id):
    """
    Remove a sample or a method from the queue, if a sample is removes all of its children task will also be removed.
        :parameter id: node identifier
        :statuscode: 200: no error
        :statuscode: 409: node could not be deleted
    """
    nodeToRemove = mxcube.queue.get_node(int(id))
    parent = nodeToRemove.get_parent()
    mxcube.queue.del_child(parent, nodeToRemove)
    entryToRemove = mxcube.queue.queue_hwobj.get_entry_with_model(nodeToRemove)
    if parent._node_id > 0:  # we are removing a method
        parentEntry = mxcube.queue.queue_hwobj.get_entry_with_model(parent)
        parentEntry.dequeue(entryToRemove)
        parent = parent._node_id
        nodeToRemove = nodeToRemove._node_id
    else:  # we are removing a sample, the parent of a sample is 'rootnode', which is not a Model
        mxcube.queue.queue_hwobj.dequeue(entryToRemove)

    Utils.save_queue(session)

    return Response(status=200)
    
@mxcube.route("/mxcube/api/v0.1/queue/<sampleid>/<methodid>", methods=['DELETE'])
def deleteMethod(sampleid, methodid):
    """
    Remove a method from a sample in the queue.
        :parameter sampleid: node identifier for the sample, integer
        :parameter methodid: node identifier for the task to be deleted, integer
        :statuscode: 200: no error
        :statuscode: 409: node could not be deleted
    """
    nodeToRemove = mxcube.queue.get_node(int(methodid))
    parent = mxcube.queue.get_node(int(sampleid))
    mxcube.queue.del_child(parent, nodeToRemove)
    entryToRemove = mxcube.queue.queue_hwobj.get_entry_with_model(nodeToRemove)
    parentEntry = mxcube.queue.queue_hwobj.get_entry_with_model(parent)
    parentEntry.dequeue(entryToRemove)
    parent = parent._node_id
    nodeToRemove = nodeToRemove._node_id
    Utils.save_queue(session)

    return Response(status=200)
    
###Adding methods to a sample
def addCentring(id):
    '''
    Add a centring task to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "CentringId": newId}
    '''
    logging.getLogger('HWR').info('[QUEUE] centring add requested with data: '+str(params))

    centNode = qmo.SampleCentring()
    centEntry = qe.SampleCentringQueueEntry()
    centEntry.set_data_model(centNode)
    centEntry.set_queue_controller(qm)
    node = mxcube.queue.get_node(int(id))
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
    entry._set_background_color = Mock()
    
    newNode = mxcube.queue.add_child_at_id(int(id), centNode)  # add_child does not return id!
    entry.enqueue(centEntry)
    
    logging.getLogger('HWR').info('[QUEUE] centring added to sample')
    
    Utils.save_queue(session)
    
    resp = jsonify({'QueueId': newNode, 'Type': 'Centring', 'Params': params})
    resp.status_code = 200
    return resp

def addCharacterisation(id):
    '''
    Add a characterisation method to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "CharacId": newId}    '''
    #no data received yet
    params = request.get_json()
    
    characNode = qmo.Characterisation()
    characEntry = qe.CharacterisationGroupQueueEntry()
    characEntry._view = Mock()
    characEntry._set_background_color = Mock()
    characEntry.set_data_model(characNode)
    characEntry.set_queue_controller(qm)
    ## char has two taskgroup levels so that the diff plan keeps under the same grandparent
    taskNode1 = qmo.TaskGroup()
    taskNode2 = qmo.TaskGroup()
    task1Entry = qe.TaskGroupQueueEntry()
    task2Entry = qe.TaskGroupQueueEntry()
    task1Entry.set_data_model(taskNode1)
    task2Entry.set_data_model(taskNode2)

    characNode.reference_image_collection.acquisitions[0].acquisition_parameters.set_from_dict(params)
    #characNode.characterisation_parameters.set_from_dict(params)
    for k, v in params.items():
        if hasattr(characNode.characterisation_parameters, k):
            setattr(characNode.characterisation_parameters, k, v)
    if params['point'] > 0: # a point id has been added
        for cpos in mxcube.diffractometer.savedCentredPos: # searching for the motor data associated with that cpos
            if cpos['posId'] == int(params['point']):
                characNode.reference_image_collection.acquisitions[0].acquisition_parameters.centred_position = qmo.CentredPosition(cpos['motorPositions'])

    node = mxcube.queue.get_node(int(id))  # this is a sampleNode
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node) # this is the corresponding sampleEntry

    task1Id = mxcube.queue.add_child_at_id(int(id), taskNode1)
    entry.enqueue(task1Entry)

    task2Id = mxcube.queue.add_child_at_id(task1Id, taskNode2)
    task1Entry.enqueue(task2Entry)
    
    newNode = mxcube.queue.add_child_at_id(task2Id, characNode)  # add_child does not return id!
    task2Entry.enqueue(characEntry)
    characEntry.set_enabled(True)
    characNode.set_enabled(True)
    logging.getLogger('HWR').info('[QUEUE] characterisation added to sample')
    
    Utils.save_queue(session)

    resp = jsonify({'QueueId': newNode, 'Type': 'Characterisation'})
    resp.status_code = 200
    return resp

def addDataCollection(id):
    '''
    Add a data collection method to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
        id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "ColId": newId}    '''
    #no data received yet
    params = request.get_json()

    colNode = qmo.DataCollection()
    colEntry = qe.DataCollectionQueueEntry()
    colEntry._view = Mock()
    colEntry.set_queue_controller(qm)
    colEntry._set_background_color = Mock()

    taskNode1 = qmo.TaskGroup()
    task1Entry = qe.TaskGroupQueueEntry()
    task1Entry.set_data_model(taskNode1)

    colNode.acquisitions[0].acquisition_parameters.set_from_dict(params)
    colNode.acquisitions[0].path_template.directory = os.path.join(mxcube.session.get_base_image_directory(), params['path'])
    colNode.acquisitions[0].path_template.run_number = params['run_number']
    colNode.acquisitions[0].path_template.base_prefix = params['prefix']
    if mxcube.queue.check_for_path_collisions(colNode.acquisitions[0].path_template):
        logging.getLogger('HWR').exception('[QUEUE] datacollection could not be added to sample: Data Collision')
        return Response(status=409)
    if params['point'] > 0: # a point id has been added
        for cpos in mxcube.diffractometer.savedCentredPos: # searching for the motor data associated with that centred_position
            if cpos['posId'] == int(params['point']):
                colNode.acquisitions[0].acquisition_parameters.centred_position = qmo.CentredPosition(cpos['motorPositions'])

    colEntry.set_data_model(colNode)
    colEntry.set_enabled(True)
    colNode.set_enabled(True)
    node = mxcube.queue.get_node(int(id))
    entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)

    task1Id = mxcube.queue.add_child_at_id(int(id), taskNode1)
    entry.enqueue(task1Entry)

    newNode = mxcube.queue.add_child_at_id(task1Id, colNode)  # add_child does not return id!
    task1Entry.enqueue(colEntry)

    Utils.save_queue(session)

    logging.getLogger('HWR').info('[QUEUE] datacollection added to sample')
    resp = jsonify({'QueueId': newNode, 'Type': 'DataCollection'})
    resp.status_code = 200
    return resp

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['POST'])
def addMethod(id):
    """
    Add a task to the given sample, the task type to add is specified in the request body.
        :parameter id: sample identifier, integer, 
        :request Content-Type: application/json, object containing the parameter(s) of the task, it must also contain {'Type':{Centring | Characterisation | DataCollection}}
        :response Content-Type: application/json, object containing the task type plus it newly created node_id for it. Example: {'QueueId': 42, 'Type': 'DataCollection'}
        :statuscode: 200: no error
        :statuscode: 409: task could not be added to the sample
    """
    params = request.data
    params = json.loads(params)
    methodType = params['Type']
    nodeId = id  # params['QueueId']

    if methodType == 'Centring':
        return addCentring(nodeId)
    elif methodType == 'Characterisation':
        return addCharacterisation(nodeId)
    elif methodType == 'DataCollection':
        return addDataCollection(nodeId)
    else:
        logging.getLogger('HWR').exception('[QUEUE] Method can not be added')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/<sampleid>/<methodid>", methods=['PUT'])
def updateMethod(sampleid, methodid):
    """
    Update the specifed task.
        :parameter sampleid: sample identifier, integer
        :parameter methodid: task identifier, integer
        :request Content-Type: application/json, object containing the parameter(s) of the task to be updated
        :statuscode: 200: no error
        :statuscode: 409: task could not be added to the sample
    """
    params = request.data
    params = json.loads(params)
    sampleNode = mxcube.queue.get_node(int(sampleid))
    methodNode = mxcube.queue.get_node(int(methodid))
    methodEntry = mxcube.queue.queue_hwobj.get_entry_with_model(methodNode)
    #TODO: update fields here, I would say that the entry does not need to be updated, only the model node

    if isinstance(methodNode, qmo.DataCollection):
        methodNode.acquisitions[0].acquisition_parameters.set_from_dict(params)
    elif isinstance(methodNode, qmo.Characterisation):
        methodNode.reference_image_collection.acquisitions[0].acquisition_parameters.set_from_dict(params)
        for k, v in params.items():
            if hasattr(methodNode.characterisation_parameters, k):
                setattr(methodNode.characterisation_parameters, k, v)
    elif isinstance(methodNode, qmo.SampleCentring):
        pass
        
    Utils.save_queue(session)

    logging.getLogger('HWR').info('[QUEUE] method updated')
    resp = jsonify({'QueueId': methodid})
    resp.status_code = 200
    return resp
  
@mxcube.route("/mxcube/api/v0.1/queue/dc", methods=['GET'])
def get_default_dc_params():
    """
    returns the default values for an acquisition (data collection). TODO: implement as_dict in the qmo.AcquisitionParameters
    """
    acq_parameters = mxcube.beamline.get_default_acquisition_parameters()
    resp = jsonify({
        'first_image' :  acq_parameters.first_image,
        'num_images' : acq_parameters.num_images,
        'osc_start' : acq_parameters.osc_start,
        'osc_range' : acq_parameters.osc_range,
        'kappa' : acq_parameters.kappa,
        'kappa_phi' : acq_parameters.kappa_phi,
        'overlap' : acq_parameters.overlap,
        'exp_time' : acq_parameters.exp_time,
        'num_passes' : acq_parameters.num_passes,
        'resolution' : acq_parameters.resolution,
        'energy' : acq_parameters.energy,
        'transmission' : acq_parameters.transmission,
        'shutterless' : acq_parameters.shutterless,
        'detector_mode' : acq_parameters.detector_mode,
        'inverse_beam' : False,
        'take_dark_current' : True,
        'skip_existing_images' : False,
        'take_snapshots' : True
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
def getSample(id):
    """
    Get the information of the given sample 
        :parameter id: sample identifier, integer
        :response Content-Type: application/json, object containing the parameter(s) of the sample. Example without parameters {"QueueId": 22, "SampleId": "3:02", "methods": []}
        :statuscode: 200: no error
        :statuscode: 409: sample could not be retrieved
    """
    ## WARNING: serializeQueueToJson() should only be used for sending to the client,
    ## here on the back-end side we should just always use mxcube.queue !
    queue = serializeQueueToJson()

    if not queue[int(id)]:
        logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
        return Response(status=409)
    else:
        resp = jsonify(queue[int(id)])
        resp.status_code = 200
        return resp
 

@mxcube.route("/mxcube/api/v0.1/queue/<sampleid>/<int:methodid>", methods=['GET'])
def getMethod(sampleid, methodid):
    """
    Get the information of the given task, beloging to the given sample
        :parameter sampleid: sample identifier, integer
        :parameter methodid: task identifier, integer
        :response Content-Type: application/json, object containing the parameter(s) of the task. Example without parameters {"QueueId": 52,  "Type": 'Centring'...}
        :statuscode: 200: no error
        :statuscode: 409: task could not be added to the sample
    """    
    ## WARNING: serializeQueueToJson() should only be used for sending to the client,
    ## here on the back-end side we should just always use mxcube.queue !
    queue = serializeQueueToJson()

    if not queue[int(sampleid)]:
        logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
        return Response(status=409)
    else:
        methods = queue[int(sampleid)]['methods']
        #find the required one
        for met in methods:
            if met['QueueId'] == int(methodid):
                resp = jsonify(met)
                resp.status_code = 200
                return resp
    logging.getLogger('HWR').exception('[QUEUE] method info could not be retrieved, it does not exits for the given sample')
    return Response(status=409)
  

@mxcube.route("/mxcube/api/v0.1/queue/json", methods=["GET"])
def serialize():
    try:
        return Response(response=jsonpickle.encode(mxcube.queue), status=200, mimetype="application/json")
    except Exception:
        logging.getLogger("HWR").exception("[QUEUE] cannot serialize")
        return Response(status=409)

def serializeQueueToJson():
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
    queueEntryList = json.loads(jsonobj)['py/state']['_HardwareObjectNode__objects'][0][0]['py/state']['_queue_entry_list']

    try:
        parent = queueEntryList[0]['py/state']['_data_model']['_parent'] ## is it always the first entry?
    except Exception:
        return {} #empty queue
    i = 1
    for entry in queueEntryList[1:]:
        if entry['py/state']['_data_model'].has_key('_node_id'):
            pass
        else:
            entry['py/state']['_data_model'] = parent['_children'][i]
        i+=1
    ## now we can iterate since the queueEntryList has all the data models

    aux = {}
    for sampEntry in queueEntryList:
        dataModel = sampEntry['py/state']['_data_model']
        aux[dataModel['_node_id']] = {"QueueId": dataModel['_node_id'],"SampleId": dataModel['loc_str'],"checked": dataModel['_enabled'],"methods":[]}

        children = dataModel['_children']
        for child in children:
            if child['py/object'].split('.')[1] == 'TaskGroup': #keep going down
                for grandChild in child['_children']:
                    if grandChild['py/object'].split('.')[1] == 'TaskGroup': #keep going down one more time for the Char
                        for grandGrandChild in grandChild['_children']:
                            if grandGrandChild['py/object'].split('.')[1] == 'Characterisation':
                                aux[dataModel['_node_id']]['methods'].append({'QueueId': grandGrandChild['_node_id'],'Type': 'Characterisation','Params': grandGrandChild['characterisation_parameters'], 'AcquisitionParams': grandGrandChild['reference_image_collection']['acquisitions'][0]['acquisition_parameters'],'checked': dataModel['_enabled'], 'executed': grandChild['_executed'], 'html_report': ''}) #grandGrandChild['characterisation_parameters']
                    elif grandChild['py/object'].split('.')[1] == 'DataCollection':
                        aux[dataModel['_node_id']]['methods'].append({'QueueId': grandChild['_node_id'],'Type': 'DataCollection','Params': {},'checked': dataModel['_enabled'], 'executed': grandChild['_executed'], 'Params': grandChild['acquisitions'][0]['acquisition_parameters']})
                    ## acq limited for now to only one element of the array, so a DataCollection entry only has a single Acquisition , done like this to simplify devel... just belean!
    return aux
