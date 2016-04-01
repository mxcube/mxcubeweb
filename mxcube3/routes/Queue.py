from mxcube3 import app as mxcube
from flask import session, request, Response, jsonify
from .Utils import *
import time
import logging
import collections
import gevent.event
import os
import json
import queue_model_objects_v1 as qmo
import QueueManager
#for mocking the view of the queue, easier than adding sth like if not view:
from HardwareRepository.BaseHardwareObjects import Null as Mock #mock import Mock
import signals
import Utils
import types
from mxcube3 import socketio
import queue_entry as qe
from queue_entry import QueueEntryContainer
import jsonpickle
qm = QueueManager.QueueManager('Mxcube3')
qm._QueueManager__execute_entry = types.MethodType(Utils.__execute_entry, qm)

def init_signals():
    # for signal in signals.queueSignals:
    #     mxcube.queue.connect(mxcube.queue.queue_hwobj, signal, signals.signalCallback)
    #for signal in signals.collectSignals:
    #    mxcube.collect.connect(mxcube.collect, signal, signals.signalCallback)
    for signal in signals.collectSignals:
        mxcube.queue.connect(mxcube.queue, signal, signals.signalCallback)
    mxcube.queue.lastQueueNode = {'id':0, 'sample':'0:0'}

# ##----QUEUE ACTIONS----##
@mxcube.route("/mxcube/api/v0.1/queue/start", methods=['PUT'])
def queueStart():
    """
    Start execution of the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be started
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to start')
    try:
        mxcube.queue.queue_hwobj.disable(False)
        mxcube.queue.queue_hwobj.execute()
        mxcube.queue.queue_hwobj._QueueManager__execute_entry = types.MethodType(Utils.__execute_entry, mxcube.queue.queue_hwobj)
        logging.getLogger('HWR').info('[QUEUE] Queue started')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be started')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/stop", methods=['PUT'])
def queueStop():
    """
    Stop execution of the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be stopped
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to stop')
    try:
        mxcube.queue.queue_hwobj.stop()
        logging.getLogger('HWR').info('[QUEUE] Queue stopped')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be stopped')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/abort", methods=['PUT'])
def queueAbort():
    """
    Abort execution of the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be aborted
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to abort')
    try:
        mxcube.queue.queue_hwobj.abort()
        logging.getLogger('HWR').info('[QUEUE] Queue aborted')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be aborted')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/pause", methods=['PUT'])
def queuePause():
    """
    Pause the execution of the queue
        :statuscode: 200: no error
        :statuscode: 409: queue could not be paused
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to pause')
    try:
        mxcube.queue.queue_hwobj.set_pause(True)
        logging.getLogger('HWR').info('[QUEUE] Queue paused')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be paused')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/unpause", methods=['PUT'])
def queueUnpause():
    """
    Unpause execution of the queue
        :statuscode: 200: no error
        :statuscode: 409: queue could not be unpause
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to unpause')
    try:
        mxcube.queue.queue_hwobj.set_pause(False)
        logging.getLogger('HWR').info('[QUEUE] Queue unpaused')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be paused')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/clear", methods=['PUT'])
def queueClear():
    """
    Clear the queue.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be started
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to clear')

    try:
        # not sure how to handle this, clearing all of them...
        mxcube.queue.clear_model('sc_one')
        mxcube.queue._selected_model._children = []
        mxcube.queue.queue_hwobj.clear()
        session["queueList"] = {} # OR jsonpickle.encode(mxcube.queue)
        logging.getLogger('HWR').info('[QUEUE] Queue cleared  '+ str(mxcube.queue.get_model_root()._name))
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be cleared')
        return Response(status=409)

#@mxlogin_required
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
    try:
        resp = jsonify(jsonParser())
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get')
        return Response(status=409)

# @mxcube.route("/mxcube/api/v0.1/queue/save2file", methods=['PUT'])
# def queueSave2File():
#     """Queue: save the queue to a file, filename automatically selected under ./routes folder
#     Args: None
#     Return: command sent successfully? http status response, 200 ok, 409 something bad happened
#     """
#     return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['PUT', 'POST'])
def queueSaveState():
    """
    Save the queue to the session.
        :request Content-Type: application/json, sampleGrid state sent by the client.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be saved
    """

    params = request.data
    params = json.loads(params)

    sampleGridState = session.get("sampleGridState")
    #queueState = jsonpickle.encode(mxcube.queue) #.update(params['queueState'])
    try:
        session["queueList"] = jsonpickle.encode(mxcube.queue)
    except Exception:
        return Response(status=409)

    sampleGridState.update(params['sampleGridState'])
    session["sampleGridState"] = sampleGridState

    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['GET'])
def queueLoadState():
    """
    Load and apply the queue from the session and return the simplified saved queue and sample_list. NOTE: the client does not do anything with it yet.
        :statuscode: 200: no error
        :statuscode: 409: queue could not be loaded
    """
    try:
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
                    }
                 }
                )
        if session.get("queueList") is None:
            logging.getLogger('HWR').info('[QUEUE] No queue was stored...')
            mxcube.queue.clear_model(mxcube.queue.get_model_root()._name)
            session["queueList"] = {}
        else:
            logging.getLogger('HWR').info('[QUEUE] Looks like a queue was stored...')
            mxcube.queue = jsonpickle.decode(session.get("queueList"))
        resp = jsonify({'queueState': jsonParser(), 'sampleList': samples})
        resp.status_code = 200
        return resp
    except Exception:
        return Response(status=409)

# @mxcube.route("/mxcube/api/v0.1/queue/load", methods=['GET'])
# def queueLoad():
#     """Queue: load the queue from a file, filename automatically selected under ./routes folder and based on the proposal name
#     Args: None
#     Return: queue data plus http status response, 200 ok, 409 something bad happened
#     """
#     resp = jsonify(jsonParser(True))
#     resp.status_code = 200
#     return resp
   
# @mxcube.route("/mxcube/api/v0.1/queue/entry/", methods=['GET'])
# def getCurrentEntry():
#     """Queue: get current entry. NOT IMPLEMENTED
#     Return:    The currently executing QueueEntry:
#     """
#     logging.getLogger('HWR').info('[QUEUE] Queue getting current entry')
#     try:
#         return mxcube.queue.queue_hwobj.get_current_entry()
#     except Exception:
#         logging.getLogger('HWR').error('[QUEUE] Queue could not get current entry')
#         return Response(status=409)

# @mxcube.route("/mxcube/api/v0.1/queue/entry/", methods=['PUT'])
# def setCurrentEntry(entry):
#     """Queue: Sets the currently executing QueueEntry to <entry>. NOT IMPLEMENTED
#     Return:    The currently executing QueueEntry:
#     """
#     logging.getLogger('HWR').info('[QUEUE] Queue getting current entry')
#     try:
#         return mxcube.queue.queue_hwobj.set_current_entry(entry)
#     except Exception:
#         logging.getLogger('HWR').error('[QUEUE] Queue could not get current entry')
#         return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/<nodeId>/execute", methods=['PUT'])
def executeEntryWithId(nodeId):
    """
    Execute the given queue entry
        :parameter nodeId: entry identifier, integer. It can be a sample or a task within a sample
        :statuscode: 200: no error, the given entry was sent to execution (any further error might still happen)
        :statuscode: 409: queue entry could not be executed
    """
    lastQueueNode = mxcube.queue.lastQueueNode
    queueList = jsonParser() #session.get("queueList")

    try:
        nodeId = int(nodeId)
        node = mxcube.queue.get_node(nodeId)
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)

        if isinstance(entry, qe.SampleQueueEntry):
            logging.getLogger('HWR').info('[QUEUE] Queue going to execute sample entry with id: %s' % nodeId)
            #this is a sample entry, thus, go through its checked children and execute those
            for elem in queueList[nodeId]['methods']:
                if int(elem['checked']) == 1:
                    logging.getLogger('HWR').info('[QUEUE] Queue executing children entry with id: %s' % elem['QueueId'])
                    childNode = mxcube.queue.get_node(elem['QueueId'])
                    childEntry = mxcube.queue.queue_hwobj.get_entry_with_model(childNode)
                    childEntry._view = Mock()  # associated text deps
                    childEntry._set_background_color = Mock()  # widget color deps
                    # if not childEntry.is_enabled():
                    #     childEntry.set_enabled(True)
                    try:
                        if mxcube.queue.queue_hwobj.is_paused():
                            logging.getLogger('HWR').info('[QUEUE] Cannot execute, queue is paused. Waiting for unpause')
                            #mxcube.queue.queue_hwobj.set_pause(False)
                            mxcube.queue.queue_hwobj.wait_for_pause_event()
                        mxcube.queue.lastQueueNode.update({'id': elem['QueueId'], 'sample': queueList[nodeId]['SampleId']})
                        #mxcube.queue.lastQueueNode = lastQueueNode
                        #mxcube.queue.queue_hwobj.execute_entry = types.MethodType(Utils.my_execute_entry, mxcube.queue.queue_hwobj)
                        mxcube.queue.queue_hwobj.execute_entry(childEntry)
                    except Exception:
                        logging.getLogger('HWR').error('[QUEUE] Queue error executing child entry with id: %s' % elem['QueueId'])
        else:
            #not a sample so execte directly
            logging.getLogger('HWR').info('[QUEUE] Queue executing entry with id: %s' % nodeId)
            if mxcube.queue.queue_hwobj.is_paused():
                logging.getLogger('HWR').info('[QUEUE] Cannot execute, queue is paused. Waiting for unpause')
                mxcube.queue.queue_hwobj.wait_for_pause_event()
            # if not entry.is_enabled():
            #     entry.set_enabled(True)
            entry._view = Mock()  # associated text deps
            entry._set_background_color = Mock()  # widget color deps
            parent = int(node.get_parent()._node_id)
            mxcube.queue.lastQueueNode.update({'id': nodeId, 'sample': queueList[parent]['SampleId']})
            #mxcube.queue.queue_hwobj.execute_entry = types.MethodType(Utils.my_execute_entry, mxcube.queue.queue_hwobj)
            mxcube.queue.queue_hwobj.execute_entry(entry)
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be started')
        return Response(status=409)

###----QUEUE ELEMENTs MANAGEMENT----###
## Deprecating Sample.py
###----SAMPLE----###

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
    basket_number, sample_number = sampleId.split(':')
    sampleNode.location = (basket_number, sample_number)
    sampleEntry = qe.SampleQueueEntry()
    sampleEntry.set_data_model(sampleNode)
    sampleEntry.set_queue_controller(qm)
    sampleEntry._view = Mock()
    sampleEntry._set_background_color = Mock()

    queueList = jsonParser()
    for i in queueList:
        if queueList[i]['SampleId'] == sampleId:
            logging.getLogger('HWR').error('[QUEUE] sample could not be added, already in the queue')
            return Response(status=409)
    try:
        mxcube.queue.add_child(mxcube.queue._selected_model, sampleNode)
        nodeId = sampleNode._node_id
        mxcube.queue.queue_hwobj.enqueue(sampleEntry)
        logging.getLogger('HWR').info('[QUEUE] sample "%s" added with queue id "%s"' %(sampleId, nodeId))
        #queueList.update({nodeId: {'SampleId': sampleId, 'QueueId': nodeId, 'checked': 0, 'methods': []}})
        session["queueList"] = jsonpickle.encode(mxcube.queue)
        return jsonify({'SampleId': sampleId, 'QueueId': nodeId})
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample could not be added')
        return Response(status=409)

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
    try:
        sampleNode = mxcube.queue.get_node(nodeId)
        if sampleNode:
            sampleEntry = mxcube.queue.queue_hwobj.get_entry_with_model(sampleNode)
            #TODO: update here the model with the new 'params'
            ### missing lines...
            sampleEntry.set_data_model(sampleNode)
            session["queueList"] = jsonpickle.encode(mxcube.queue)
            logging.getLogger('HWR').info('[QUEUE] sample updated')
            resp = jsonify({'QueueId': nodeId})
            resp.status_code = 200
            return resp
        else:
            logging.getLogger('HWR').exception('[QUEUE] sample not in the queue, can not update')
            return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample could not be updated')
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
    queueList = jsonParser()

    try:
        if isinstance(entry, qe.SampleQueueEntry):
            queueList[nodeId]['checked'] = int(not queueList[nodeId]['checked'])
            #this is a sample entry, thus, go through its checked children and toggle those
            if queueList[nodeId]['checked'] == 1:
                entry.set_enabled(True)
            else:
                entry.set_enabled(False)

            for elem in queueList[nodeId]['methods']:
                elem['checked'] = int(queueList[nodeId]['checked'])
                childNode = mxcube.queue.get_node(elem['QueueId'])
                childEntry = mxcube.queue.queue_hwobj.get_entry_with_model(childNode)
                if elem['checked'] == 1:
                    childEntry.set_enabled(True)
                else:
                    childEntry.set_enabled(False)
        else:
            #not a sample so find the parent and toggle directly
            logging.getLogger('HWR').info('[QUEUE] toggling entry with id: %s' % nodeId)
            parentNode = node.get_parent()
            parent = node.get_parent()._node_id
            parentEntry = mxcube.queue.queue_hwobj.get_entry_with_model(parentNode)
            checked = 0
            for i in queueList[parent]['methods']:
                if i['QueueId'] != nodeId and i['checked'] == 1:
                    checked = 1
                    break
            for met in queueList[parent]['methods']:
                if int(met.get('QueueId')) == nodeId:
                    met['checked'] = int(not met['checked'])
                    if met['checked'] == 0 and checked == 0:
                        parentEntry.set_enabled(False)
                    elif met['checked'] == 1 and checked == 0:
                        parentEntry.set_enabled(True)

        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue element %s could not be toggled' % id)
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['DELETE'])
def deleteSampleOrMethod(id):
    """
    Remove a sample or a method from the queue, if a sample is removes all of its children task will also be removed.
        :parameter id: node identifier
        :statuscode: 200: no error
        :statuscode: 409: node could not be deleted
    """
    queueList = jsonParser() #session.get("queueList")

    try:
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
        
        session["queueList"] = jsonpickle.encode(mxcube.queue)

        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queued sample could not be deleted')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/<sampleid>/<methodid>", methods=['DELETE'])
def deleteMethod(sampleid, methodid):
    """
    Remove a method from a sample in the queue.
        :parameter sampleid: node identifier for the sample, integer
        :parameter methodid: node identifier for the task to be deleted, integer
        :statuscode: 200: no error
        :statuscode: 409: node could not be deleted
    """
    try:
        nodeToRemove = mxcube.queue.get_node(int(methodid))
        parent = mxcube.queue.get_node(int(sampleid))
        mxcube.queue.del_child(parent, nodeToRemove)
        entryToRemove = mxcube.queue.queue_hwobj.get_entry_with_model(nodeToRemove)
        parentEntry = mxcube.queue.queue_hwobj.get_entry_with_model(parent)
        parentEntry.dequeue(entryToRemove)
        parent = parent._node_id
        nodeToRemove = nodeToRemove._node_id
        session["queueList"] = jsonpickle.encode(mxcube.queue)

        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queued sample could not be deleted')
        return Response(status=409)

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

    try:
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

        session["queueList"] = jsonpickle.encode(mxcube.queue)

        resp = jsonify({'QueueId': newNode, 'Type': 'Centring', 'Params': params})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] centring could not be added to sample')
        return Response(status=409)

def addCharacterisation(id):
    '''
    Add a characterisation method to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "CharacId": newId}    '''
    #no data received yet
    params = request.get_json()
    try:
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

        logging.getLogger('HWR').info('[QUEUE] characterisation added to sample')

        session["queueList"] = jsonpickle.encode(mxcube.queue)

        resp = jsonify({'QueueId': newNode, 'Type': 'Characterisation'})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] characterisation could not be added to sample')
        return Response(status=409)

def addDataCollection(id):
    '''
    Add a data collection method to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
        id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "ColId": newId}    '''
    #no data received yet
    params = request.get_json()

    try:
        colNode = qmo.DataCollection()
        colEntry = qe.DataCollectionQueueEntry()
        colEntry._view = Mock()
        colEntry.set_queue_controller(qm)
        colEntry._set_background_color = Mock()

        taskNode1 = qmo.TaskGroup()
        task1Entry = qe.TaskGroupQueueEntry()
        task1Entry.set_data_model(taskNode1)

        colNode.acquisitions[0].acquisition_parameters.set_from_dict(params)
        if params['point'] > 0: # a point id has been added
            for cpos in mxcube.diffractometer.savedCentredPos: # searching for the motor data associated with that centred_position
                if cpos['posId'] == int(params['point']):
                    colNode.acquisitions[0].acquisition_parameters.centred_position = qmo.CentredPosition(cpos['motorPositions'])
        
        colEntry.set_data_model(colNode)

        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        
        task1Id = mxcube.queue.add_child_at_id(int(id), taskNode1)
        entry.enqueue(task1Entry)

        newNode = mxcube.queue.add_child_at_id(task1Id, colNode)  # add_child does not return id!
        task1Entry.enqueue(colEntry)

        session["queueList"] = jsonpickle.encode(mxcube.queue)

        logging.getLogger('HWR').info('[QUEUE] datacollection added to sample')
        resp = jsonify({'QueueId': newNode, 'Type': 'DataCollection'})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] datacollection could not be added to sample')
        return Response(status=409)

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
    try:
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
        ####
        
        session["queueList"] = jsonpickle.encode(mxcube.queue)

        logging.getLogger('HWR').info('[QUEUE] method updated')
        resp = jsonify({'QueueId': methodid})
        resp.status_code = 200
        return resp
    except Exception as ex:
        logging.getLogger('HWR').exception('[QUEUE] centring could not be added to sample')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['GET'])
def getSample(id):
    """
    Get the information of the given sample 
        :parameter id: sample identifier, integer
        :response Content-Type: application/json, object containing the parameter(s) of the sample. Example without parameters {"QueueId": 22, "SampleId": "3:02", "methods": []}
        :statuscode: 200: no error
        :statuscode: 409: sample could not be retrieved
    """
    try:
        queueList = jsonParser()
        if not queueList[int(id)]:
            logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
            return Response(status=409)
        else:
            resp = jsonify(queueList[int(id)])
            resp.status_code = 200
            return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample info could not be retrieved')
        return Response(status=409)

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
    try:
        queueList = jsonParser()
        if not queueList[int(sampleid)]:
            logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
            return Response(status=409)
        else:
            methods = queueList[int(sampleid)]['methods']
            #find the required one
            for met in methods:
                if met['QueueId'] == int(methodid):
                    resp = jsonify(met)
                    resp.status_code = 200
                    return resp
        logging.getLogger('HWR').exception('[QUEUE] method info could not be retrieved, it does not exits for the given sample')
        return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] method info could not be retrieved')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/json", methods=["GET"])
def serialize():
    try:
        return Response(response=jsonpickle.encode(mxcube.queue), status=200, mimetype="application/json")
    except Exception:
        logging.getLogger("HWR").exception("[QUEUE] cannot serialize")
        return Response(status=409)

def jsonParser(fromSession = False):
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
    if not fromSession:
        jsonobj = jsonpickle.encode(mxcube.queue)
        queueEntryList = json.loads(jsonobj)['py/state']['_HardwareObjectNode__objects'][0][0]['py/state']['_queue_entry_list']
    else:
        queueEntryList = session['queueList']['py/state']['_HardwareObjectNode__objects'][0][0]['py/state']['_queue_entry_list']
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
        aux[dataModel['_node_id']] = {"QueueId": dataModel['_node_id'],"SampleId": dataModel['loc_str'],"checked": 0,"methods":[]}

        children = dataModel['_children']
        for child in children:
            if child['py/object'].split('.')[1] == 'TaskGroup': #keep going down
                for grandChild in child['_children']:
                    if grandChild['py/object'].split('.')[1] == 'TaskGroup': #keep going down one more time for the Char
                        for grandGrandChild in grandChild['_children']:
                            if grandGrandChild['py/object'].split('.')[1] == 'Characterisation':
                                aux[dataModel['_node_id']]['methods'].append({'QueueId': grandGrandChild['_node_id'],'Type': 'Characterisation','Params': grandGrandChild['characterisation_parameters'], 'AcquisitionParams': grandGrandChild['reference_image_collection']['acquisitions'][0]['acquisition_parameters'],'checked': 0, 'executed': grandChild['_executed'], 'html_report': ''}) #grandGrandChild['characterisation_parameters']
                    elif grandChild['py/object'].split('.')[1] == 'DataCollection':
                        aux[dataModel['_node_id']]['methods'].append({'QueueId': grandChild['_node_id'],'Type': 'DataCollection','Params': {},'checked': 0, 'executed': grandChild['_executed'], 'Params': grandChild['acquisitions'][0]['acquisition_parameters']})
                    ## acq limited for now to only one element of the array, so a DataCollection entry only has a single Acquisition , done like this to simplify devel... just belean!
    return aux
