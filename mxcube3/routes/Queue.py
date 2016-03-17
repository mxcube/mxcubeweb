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
#qm._QueueManager__execute_entry = types.MethodType(Utils.__execute_entry, qm)

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
    """Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
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
    """Queue: stop execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
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
    """Queue: abort execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
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
    """Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to pause')
    try:
        mxcube.queue.queue_hwobj.set_pause(True)
        # mxcube.queue.pause()
        logging.getLogger('HWR').info('[QUEUE] Queue paused')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be paused')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/unpause", methods=['PUT'])
def queueUnpause():
    """Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to unpause')
    try:
        mxcube.queue.queue_hwobj.set_pause(False)
        # mxcube.queue.pause()
        logging.getLogger('HWR').info('[QUEUE] Queue unpaused')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be paused')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/clear", methods=['PUT'])
def queueClear():
    """Queue: clear the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
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
    """Queue: get the queue
    Args: None
    Return: a list of queue entries (sample with the associated children methods)
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting data')
    try:
        resp = jsonify(jsonParser())
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/save2file", methods=['PUT'])
def queueSave2File():
    """Queue: save the queue to a file, filename automatically selected under ./routes folder
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['PUT', 'POST'])
def queueSaveState():
    """Queue: save the queue to a file, filename automatically selected under ./routes folder
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """

    params = request.data
    params = json.loads(params)

    sampleGridState = session.get("sampleGridState")
    #queueState = jsonpickle.encode(mxcube.queue) #.update(params['queueState'])
    
    session["queueList"] = jsonpickle.encode(mxcube.queue)
    sampleGridState.update(params['sampleGridState'])
    session["sampleGridState"] = sampleGridState

    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['GET'])
def queueLoadState():
    """Queue: load and apply the queue from the session and return the simplified saved queue and sample_list
    Args: None
    Return: http status response, 200 ok, 409 something bad happened. And {'queueState': {...}, 'sampleList': {...} }
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
   
@mxcube.route("/mxcube/api/v0.1/queue/entry/", methods=['GET'])
def getCurrentEntry():
    """Queue: get current entry. NOT IMPLEMENTED
    Args: None
    Return:    The currently executing QueueEntry:
                :rtype: QueueEntry
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting current entry')
    try:
        return mxcube.queue.queue_hwobj.get_current_entry()
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get current entry')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/entry/", methods=['PUT'])
def setCurrentEntry(entry):
    """Queue: Sets the currently executing QueueEntry to <entry>. NOT IMPLEMENTED
    Args: None
    Return:    The currently executing QueueEntry:
                :rtype: QueueEntry
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting current entry')
    try:
        return mxcube.queue.queue_hwobj.set_current_entry(entry)
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get current entry')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/<nodeId>/execute", methods=['PUT'])
def executeEntryWithId(nodeId):
    """
    Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
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
    Add a sample to the queue with an id in the form of '1:01'
    Args: id, current id of the sample to be added
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={"QueueId": newId, "SampleId": sampleId}, where sampleId is the same as the caller id (eg '1:01')
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

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['PUT'])
def updateSample(id):
    '''
    Update a sample info
    Args: none
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={"QueueId": newId, "SampleId": sampleId}, where sampleId is the same as the caller id (eg '1:01')
    '''
    params = request.data
    params = json.loads(params)
    nodeId = int(id)  # params['QueueId']
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
    toggle a sample or a method checked status
    Args: none
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened.
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
    Remove a sample or a method to the queue with an id in the form of 1,4,32
    Args: id, current id of the sample/method to be deleted
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
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
    Remove a sample or a method to the queue with an id in the form of 1,4,32
    Args: id, current id of the sample/method to be deleted
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
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
    Add a centring method to the sample with id: <id>, integer.
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
    Get the information of the sample with id:"id"
    Args: id, current id of the sample
        id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
        data ={"QueueId": 22, "SampleId": "3:02", "methods": []}
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
    Get the information of the sample with id:"id"
    Args: id, current id of the sample
        id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
        data ={"QueueId": 22, "SampleId": "3:02", "methods": []}
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
