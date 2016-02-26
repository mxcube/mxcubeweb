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
    for signal in signals.collectSignals:
        mxcube.collect.connect(mxcube.collect, signal, signals.signalCallback)
    for signal in signals.collectSignals:
        mxcube.queue.connect(mxcube.queue, signal, signals.signalCallback)

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
        mxcube.queue.clear_model(mxcube.queue.get_model_root()._name)
        #mxcube.queue.queue_hwobj.clear()# already done in the previous call
        session["queueList"] = {}
        logging.getLogger('HWR').info('[QUEUE] Queue cleared')
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
    queueList = session.get("queueList")

    try:
        resp = jsonify(queueList)
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
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['PUT', 'POST'])
def queueSaveState():
    """Queue: save the queue to a file, filename automatically selected under ./routes folder
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    params = request.data
    params = json.loads(params)
    queueState = session.get("queueState")
    sampleGridState = session.get("sampleGridState")
    queueState.update(params['queueState'])
    session["queueState"] = queueState
    sampleGridState.update(params['sampleGridState'])
    session["sampleGridState"] = sampleGridState
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/queue/state", methods=['GET'])
def queueLoadState():
    """Queue: save the queue to a file, filename automatically selected under ./routes folder
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    queueState = session.get("queueState")
    sampleGridState = session.get("sampleGridState")

    resp = jsonify({'queueState': queueState, 'sampleGridState': sampleGridState})
    resp.status_code = 200
    return resp

@mxcube.route("/mxcube/api/v0.1/queue/load", methods=['GET'])
def queueLoad():
    """Queue: load the queue from a file, filename automatically selected under ./routes folder and based on the proposal name
    Args: None
    Return: queue data plus http status response, 200 ok, 409 something bad happened
    """
    resp = jsonify(session.get("queueList"))
    resp.status_code = 200
    return resp
   
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
    lastQueueNode = session.get("lastQueueNode")
    queueList = session.get("queueList")

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
                        lastQueueNode.update({'id': elem['QueueId'], 'sample': queueList[nodeId]['SampleId']})
                        session["lastQueueNode"] = lastQueueNode
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
            lastQueueNode.update({'id': nodeId, 'sample': queueList[parent]['SampleId']})
            session["lastQueueNode"] = lastQueueNode
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

    queueList = session.get("queueList")
    queueOrder = session.get("queueOrder")

    for i in queueList:
        if queueList[i]['SampleId'] == sampleId:
            logging.getLogger('HWR').error('[QUEUE] sample could not be added, already in the queue')
            return Response(status=409)
    try:
        mxcube.queue.add_child(mxcube.queue._selected_model, sampleNode)
        nodeId = sampleNode._node_id
        mxcube.queue.queue_hwobj.enqueue(sampleEntry)
        logging.getLogger('HWR').info('[QUEUE] sample added')
        queueList.update({nodeId: {'SampleId': sampleId, 'QueueId': nodeId, 'checked': 0, 'methods': []}})
        session["queueList"] = queueList
        queueOrder.append(nodeId)
        session["queueOrder"] = queueOrder
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
            queueList[nodeId].update(params)
            session["queueList"] = queueList
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
    queueList = session.get("queueList")

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
            #myBrothers = [i._node_id for i in parent.get_children()].remove(nodeId) #and only my brothers
            #checkedBrothers =  queueList[parent]['methods']
            checked = 0
            for i in queueList[parent]['methods']:
                if i['QueueId'] != nodeId and i['checked'] == 1:
                    checked = 1
                    break
            #queueList[parent]['methods'] = int(not queueList[nodeId]['checked'])
            for met in queueList[parent]['methods']:
                if int(met.get('QueueId')) == nodeId:
                    met['checked'] = int(not met['checked'])
                    if met['checked'] == 0 and checked == 0:
                        queueList[parent]['checked'] = 0
                        parentEntry.set_enabled(False)
                    elif met['checked'] == 1 and checked == 0:
                        queueList[parent]['checked'] = 1
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
    queueList = session.get("queueList")
    queueOrder = session.get("queueOrder")

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
            for met in queueList[parent]['methods']:
                if met[met.keys()[0]] == nodeToRemove:
                    queueList[parent]['methods'].remove(met)
            #queueList.pop(int(id))
        else:  # we are removing a sample, the parent of a sample is 'rootnode', which is not a Model
            mxcube.queue.queue_hwobj.dequeue(entryToRemove)
            queueList.pop(int(id))
            session["queueList"] = queueList
            queueOrder.remove(int(id))
            session["queueOrder"] = queueOrder
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
    queueList = session.get("queueList", {})

    try:
        nodeToRemove = mxcube.queue.get_node(int(methodid))
        parent = mxcube.queue.get_node(int(sampleid))
        mxcube.queue.del_child(parent, nodeToRemove)
        entryToRemove = mxcube.queue.queue_hwobj.get_entry_with_model(nodeToRemove)
        parentEntry = mxcube.queue.queue_hwobj.get_entry_with_model(parent)
        parentEntry.dequeue(entryToRemove)
        parent = parent._node_id
        nodeToRemove = nodeToRemove._node_id
        for met in queueList[parent]['methods']:
            if met[met.keys()[0]] == nodeToRemove:
                queueList[parent]['methods'].remove(met)
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
    params = request.get_json()
    queueList = session.get("queueList", {})

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
        queueList[int(id)]['methods'].append({'QueueId': newNode, 'Name': 'Centring', 'Params': params, 'checked': 1})
        logging.getLogger('HWR').info('[QUEUE] centring added to sample')
        resp = jsonify({'QueueId': newNode, 'Name': 'Centring', 'Params': params})
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
    queueList = session.get("queueList", {})

    try:
        characNode = qmo.Characterisation()
        characEntry = qe.CharacterisationGroupQueueEntry()
        characEntry._view = Mock()
        characEntry._set_background_color = Mock()
        characEntry.set_data_model(characNode)
        characEntry.set_queue_controller(qm)

        for k, v in params.items():
            setattr(characNode.reference_image_collection.acquisitions[0].acquisition_parameters, k, v)
        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), characNode)  # add_child does not return id!
        entry.enqueue(characEntry)
        queueList[int(id)]['methods'].append({'QueueId': newNode, 'Name': 'Characterisation', 'Params': params, 'checked': 1})
        session["queueList"] = queueList
        logging.getLogger('HWR').info('[QUEUE] characterisation added to sample')
        resp = jsonify({'QueueId': newNode, 'Name': 'Characterisation'})
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
    queueList = session.get("queueList")

    try:
        colNode = qmo.DataCollection()
        colEntry = qe.DataCollectionQueueEntry()
        colEntry._view = Mock()
        colEntry.set_queue_controller(qm)
        colEntry._set_background_color = Mock()

        #populating dc parameters from data sent by the client
        for k, v in params.items():
            setattr(colNode.acquisitions[0].acquisition_parameters, k, v)
        colEntry.set_data_model(colNode)
        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), colNode)  # add_child does not return id!
        entry.enqueue(colEntry)
        queueList[int(id)]['methods'].append({'QueueId': newNode, 'Name': 'DataCollection', 'Params': params, 'checked': 1})  # 'isCollected':node.is_collected()})
        session["queueList"] = queueList
        logging.getLogger('HWR').info('[QUEUE] datacollection added to sample')
        resp = jsonify({'QueueId': newNode, 'Name': 'DataCollection'})
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
        queueList = session.get("queueList")
        #TODO: update fields here, I would say that the entry does not need to be updated, only the model node

        if isinstance(methodNode, qmo.DataCollection):
            for k, v in params.items():
                setattr(methodNode.acquisitions[0].acquisition_parameters, k, v)
        elif isinstance(methodNode, qmo.Characterisation):
            for k, v in params.items():
                setattr(methodNode.reference_image_collection.acquisitions[0].acquisition_parameters, k, v)
        elif isinstance(methodNode, qmo.SampleCentring):
            pass
        ####
        params = {'Params': params}
        for met in queueList[int(sampleid)]['methods']:
            if met[met.keys()[0]] == int(methodid):
                met.update(params)
        session["queueList"] = queueList
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
    queueList = session.get("queueList")

    try:
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
    queueList = session.get("queueList")

    try:
        if not queueList[int(sampleid)]:
            logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
            return Response(status=409)
        else:
            methods = queueList[int(sampleid)]['methods']
            #find the required one
            for met in methods:
                print met
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


#####################################
###to be programmed....
#####################################
# @mxcube.route("/mxcube/api/v0.1/queue/<id>/mode", methods=['POST'])
# def set_sample_mode2(id):
#     """Set sample changer mode: sample changer, manually mounted, ... (maybe it is enoug to set for all the same mode)
#     data = {generic_data, "Mode": mode}
#     return_data={"result": True/False}
#     """
#     data = dict(request.POST.items())
#     return samples.getMode(data)
