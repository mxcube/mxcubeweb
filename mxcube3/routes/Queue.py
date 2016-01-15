from flask import session, redirect, url_for, render_template, request, Response, stream_with_context, jsonify
from mxcube3 import app as mxcube
from .Utils import *
import time, logging, collections
import gevent.event
import os, json
import queue_model_objects_v1 as qmo
#for mocking the view of the queue, easier than adding sth like if not view:
from mock import Mock

queueList={}
queueOrder=[]

###----QUEUE ACTIONS----###
@mxcube.route("/mxcube/api/v0.1/queue/start", methods=['PUT'])
def queueStart():
    """Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to start')
    try:
    	mxcube.queue.start()
    	logging.getLogger('HWR').info('[QUEUE] Queue started')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be started')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/stop", methods=['PUT'])
def queueStop():
    """Queue: stop execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to stop')
    try:
    	mxcube.queue.stop()
    	logging.getLogger('HWR').info('[QUEUE] Queue stopped')
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be stopped')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/abort", methods=['PUT'])
def queueAbort():
    """Queue: abort execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to abort')
    try:
        mxcube.queue.abort()
        logging.getLogger('HWR').info('[QUEUE] Queue aborted')
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be aborted')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/pause", methods=['PUT'])
def queuePause():
    """Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to pause')
    try:
        mxcube.queue.pause()
        logging.getLogger('HWR').info('[QUEUE] Queue paused')
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be paused')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/clear", methods=['PUT'])
def queueClear():
    """Queue: clear the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to clear')
    try:
        mxcube.queue.clear_model(mxcube.queue.get_model_root()._name)#model name?? rootNode?
        #mxcube.queue.queue_hwobj.clear()#already done in the previous call
        queueList.clear()
        logging.getLogger('HWR').info('[QUEUE] Queue cleared')
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be cleared')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue", methods=['GET'])
def queueGet():
    """Queue: get the queue
    Args: None
    Return: a list of queue entries (sample with the associated children methods)
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting data')
    try:
        resp = jsonify(queueList)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/save", methods=['PUT'])
def queueSave():
    """Queue: save the queue to a file, filename automatically selected under ./routes folder
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """

    filename = os.path.join(os.path.dirname(os.path.abspath(__file__)),'queue-'+mxcube.session.proposal_id+'.txt')
    try:
        f = open(filename, 'w')
        tofile = json.dumps(queueList) 
        f.write(tofile)
        f.close()
        logging.getLogger('HWR').info('[QUEUE] Queue saved, '+filename)
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be saved')
        return Response(status = 409)
       
@mxcube.route("/mxcube/api/v0.1/queue/load", methods=['GET'])
def queueLoad():
    """Queue: load the queue from a file, filename automatically selected under ./routes folder and based on the proposal name
    Args: None
    Return: queue data plus http status response, 200 ok, 409 something bad happened
    """
    filename = os.path.join(os.path.dirname(os.path.abspath(__file__)),'queue-'+mxcube.session.proposal_id+'.txt')
    try:
        f = open(filename, 'r')
        data = json.loads(f.read())
        f.close()
        logging.getLogger('HWR').info('[QUEUE] Queue loaded, '+filename)
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be loaded')
        return Response(status = 409)

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
        return Response(status = 409)

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
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<nodeId>/execute", methods=['PUT'])
def executeEntryWithId(nodeId):
    """
    Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to execute entry with id: %s' %nodeId)
    try:        
        nodeId = int(nodeId)
        node = mxcube.queue.get_node(nodeId)
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        if isinstance(entry, qe.SampleQueueEntry):
            #this is a sample entry, thus, go through its checked children and execute those
            for elem in queueList[nodeId]['methods']:
                if elem['checked'] == 'True':
                    logging.getLogger('HWR').info('[QUEUE] Queue executing children entry with id: %s' %elem['QueueId'])
                    childNode = mxcube.queue.get_node(elem['QueueId'])
                    childEntry = mxcube.queue.queue_hwobj.get_entry_with_model(childNode)
                    childEntry._view = Mock() #associated text deps
                    childEntry._set_background_color = Mock() #widget color deps
                    if not childEntry.is_enabled():
                        childEntry.set_enabled(True)
                    mxcube.queue.queue_hwobj.execute_entry(childEntry)
        else:
            #not a sample so execte directly
            logging.getLogger('HWR').info('[QUEUE] Queue executing entry with id: %s' %nodeId)

            if not entry.is_enabled():
                entry.set_enabled(True)
            entry._view = Mock() #associated text deps
            entry._set_background_color = Mock() #widget color deps
            mxcube.queue.queue_hwobj.execute_entry(entry)
    
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be started')
        return Response(status = 409)

###----QUEUE ELEMENTs MANAGEMENT----###
## Deprecating Sample.py
###----SAMPLE----###
import queue_entry as qe
from queue_entry import QueueEntryContainer
@mxcube.route("/mxcube/api/v0.1/queue", methods=['POST'])
def addSample():
    '''
    Add a sample to the queue with an id in the form of '1:01'
    Args: id, current id of the sample to be added
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={"QueueId": newId, "SampleId": sampleId}, where sampleId is the same as the caller id (eg '1:01')
    '''
    params = request.data#get_json()
    params = json.loads(params)
    sampleId = params['SampleId']
    sampleNode = qmo.Sample()
    sampleEntry = qe.SampleQueueEntry()
    sampleEntry.set_data_model(sampleNode)
    for i in queueList:
        if queueList[i]['SampleId'] == sampleId:
            logging.getLogger('HWR').error('[QUEUE] sample could not be added, already in the queue')
            return Response(status = 409)
    try:
        mxcube.queue.add_child(mxcube.queue._selected_model,sampleNode)
        nodeId = sampleNode._node_id
        mxcube.queue.queue_hwobj.enqueue(sampleEntry)
        logging.getLogger('HWR').info('[QUEUE] sample added')
        queueList.update({nodeId:{'SampleId': sampleId, 'QueueId': nodeId, 'checked': 'False', 'methods':[]}})
        queueOrder.append(nodeId)
        return jsonify({'SampleId': sampleId, 'QueueId': nodeId} )
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample could not be added')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['PUT'])
def updateSample(id):
    '''
    Update a sample info
    Args: none
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={"QueueId": newId, "SampleId": sampleId}, where sampleId is the same as the caller id (eg '1:01')
    '''
    params = request.data#get_json()
    params = json.loads(params)
    nodeId = int(id) #params['QueueId']
    try:
        sampleNode = mxcube.queue.get_node(nodeId)
        if sampleNode:
            sampleEntry = mxcube.queue.queue_hwobj.get_entry_with_model(sampleNode)
            #TODO: update here the model with the new 'params'
            ### missing lines...
            sampleEntry.set_data_model(sampleNode)
            queueList[nodeId].update(params)
            logging.getLogger('HWR').info('[QUEUE] sample updated')
            resp = jsonify({'QueueId': nodeId} )
            resp.status_code = 200
            return resp
        else:
            logging.getLogger('HWR').exception('[QUEUE] sample not in the queue, can not update')
            return Response(status = 409)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample could not be updated')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['DELETE'])
def deleteSampleOrMethod(id):
    """
    Remove a sample or a method to the queue with an id in the form of 1,4,32
    Args: id, current id of the sample/method to be deleted
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    try:
        nodeToRemove = mxcube.queue.get_node(int(id))
        parent = nodeToRemove.get_parent()
        mxcube.queue.del_child(parent, nodeToRemove)
        entryToRemove = mxcube.queue.queue_hwobj.get_entry_with_model(nodeToRemove)
        if parent._node_id > 0: #we are removing a method
            parentEntry = mxcube.queue.queue_hwobj.get_entry_with_model(parent)
            parentEntry.dequeue(entryToRemove)
            parent = parent._node_id
            nodeToRemove = nodeToRemove._node_id
            for met in queueList[parent]['methods']:
                if met[met.keys()[0]] == nodeToRemove:
                    queueList[parent]['methods'].remove(met)
            #queueList.pop(int(id))
        else: # we are removing a sample, the parent of a sample is 'rootnode', which is not a Model
            mxcube.queue.queue_hwobj.dequeue(entryToRemove)
            queueList.pop(int(id))
            queueOrder.remove(int(id))
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queued sample could not be deleted')
        return Response(status = 409)
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
        for met in queueList[parent]['methods']:
            if met[met.keys()[0]] == nodeToRemove:
                queueList[parent]['methods'].remove(met)
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queued sample could not be deleted')
        return Response(status = 409)
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
    logging.getLogger('HWR').info('[QUEUE] centring add requested with data: '+str(params))
    try:
        centNode = qmo.SampleCentring()
        centEntry = qe.SampleCentringQueueEntry()
        centEntry.set_data_model(centNode)

        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), centNode) #add_child does not return id!
        entry.enqueue(centEntry)
        queueList[int(id)]['methods'].append({'QueueId':newNode, 'Name': 'Centring','Params':params, 'checked':'False'})
        logging.getLogger('HWR').info('[QUEUE] centring added to sample')
        resp = jsonify({'QueueId':newNode, 'Name': 'Centring', 'Params':params})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] centring could not be added to sample')
        return Response(status = 409)
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
        characEntry = qe.CharacterisationQueueEntry()
        characEntry.set_data_model(characNode)
        for k, v in params.items():
            setattr(characNode.reference_image_collection.acquisitions[0].acquisition_parameters, k, v)
        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), characNode) #add_child does not return id!
        entry.enqueue(characEntry)
        queueList[int(id)]['methods'].append({'QueueId':newNode, 'Name':'Characterisation','Params':params, 'checked':'False'})
        logging.getLogger('HWR').info('[QUEUE] characterisation added to sample')
        resp = jsonify({'QueueId':newNode, 'Name': 'Characterisation'})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] characterisation could not be added to sample')
        return Response(status = 409)
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
        #populating dc parameters from data sent by the client
        for k, v in params.items():
            setattr(colNode.acquisitions[0].acquisition_parameters, k, v)
        colEntry.set_data_model(colNode)
        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), colNode) #add_child does not return id!
        entry.enqueue(colEntry)
        queueList[int(id)]['methods'].append({'QueueId':newNode, 'Name':'DataCollection','Params':params, 'checked':'False'})
        logging.getLogger('HWR').info('[QUEUE] datacollection added to sample')
        resp = jsonify({'QueueId':newNode, 'Name': 'DataCollection'})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] datacollection could not be added to sample')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['POST'])
def addMethod(id):
    params = request.data#get_json()
    params = json.loads(params)
    methodType = params['Type']
    nodeId = id #params['QueueId']

    if methodType == 'Centring':
        return addCentring(nodeId)
    elif methodType == 'Characterisation':
        return addCharacterisation(nodeId)
    elif methodType == 'DataCollection':
        return addDataCollection(nodeId)
    else:
        logging.getLogger('HWR').exception('[QUEUE] Method can not be added')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<sampleid>/<methodid>", methods=['PUT'])
def updateMethod(sampleid, methodid):
    try:
        params = request.data#get_json()
        params = json.loads(params)
        sampleNode = mxcube.queue.get_node(int(sampleid))
        methodNode = mxcube.queue.get_node(int(methodid))
        methodEntry = mxcube.queue.queue_hwobj.get_entry_with_model(methodNode)
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
        for met in queueList[int(sampleid)]['methods']:
            if met[met.keys()[0]] == int(methodid):
                met.update(params)
        logging.getLogger('HWR').info('[QUEUE] method updated')
        resp = jsonify({'QueueId':methodid})
        resp.status_code = 200
        return resp
    except Exception as ex:
        logging.getLogger('HWR').exception('[QUEUE] centring could not be added to sample')
        return Response(status = 409)

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
        if not queueList[int(id)]:
            logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
            return Response(status = 409)
        else:
            resp = jsonify(queueList[int(id)])
            resp.status_code = 200
            return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample info could not be retrieved')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<sampleid>/<methodid>", methods=['GET'])
def getMethod(sampleid, methodid):
    """
    Get the information of the sample with id:"id"
    Args: id, current id of the sample
        id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
        data ={"QueueId": 22, "SampleId": "3:02", "methods": []}
    """
    try:
        if not queueList[int(sampleid)]:
            logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
            return Response(status = 409)
        else:
            methods = queueList[int(sampleid)]['methods']
            #find the required one
            for met in methods:
                print met
                if met['QueueId']== int(methodid):
                    resp = jsonify(met)
                    resp.status_code = 200
                    return resp
        logging.getLogger('HWR').exception('[QUEUE] method info could not be retrieved, it does not exits for the given sample')
        return Response(status = 409)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] method info could not be retrieved')
        return Response(status = 409)
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
