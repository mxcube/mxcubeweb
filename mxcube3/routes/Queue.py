from flask import session, redirect, url_for, render_template, request, Response, stream_with_context, jsonify
from mxcube3 import app as mxcube
import time, logging, collections
import gevent.event
import os, json
import queue_model_objects_v1 as qmo

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

@mxcube.route("/mxcube/api/v0.1/queue/save", methods=['GET'])
def queueSave():
    """Queue: save the queue to a file, filename automatically selected under ./routes folder
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue saving')
    filename = os.path.join(os.path.dirname(os.path.abspath(__file__)),'queue-backup.txt')
    try:
        f = open(filename, 'w')
        tofile = json.dumps(queueList) 
        f.write(tofile)
        f.close()
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').error('[QUEUE] Queue could saved')
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

@mxcube.route("/mxcube/api/v0.1/queue/<entry>/execute", methods=['PUT'])
def executeEntryWithId(entry):
    """
    Queue: start execution of the queue
    Args: None
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to execute entry with id: %s' %id)
    try:
        mxcube.queue.queue_hwobj.execute_entry(entry)
        logging.getLogger('HWR').info('[QUEUE] Queue executing entry with id: %s' %id)
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] Queue could not be started')
        return Response(status = 409)

###----QUEUE ELEMENTs MANAGEMENT----###
## Deprecating Sample.py
###----SAMPLE----###
import queue_entry as qe
from queue_entry import QueueEntryContainer

@mxcube.route("/mxcube/api/v0.1/queue/add/<id>", methods=['POST','PUT'])
def addSample(id):
    '''
    Add a sample to the queue with an id in the form of '1:01'
    Args: id, current id of the sample to be added
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={"QueueId": newId, "SampleId": sampleId}, where sampleId is the same as the caller id (eg '1:01')
    '''
    sampleNode = qmo.Sample()
    sampleEntry = qe.SampleQueueEntry()
    sampleEntry.set_data_model(sampleNode)
    for i in queueList:
        if queueList[i]['SampleId'] == id:
            logging.getLogger('HWR').error('[QUEUE] sample could not be added, already in the queue')
            return Response(status = 409)
    try:
        mxcube.queue.add_child(mxcube.queue._selected_model,sampleNode)
        nodeId = sampleNode._node_id
        mxcube.queue.queue_hwobj.enqueue(sampleEntry)
        logging.getLogger('HWR').info('[QUEUE] sample added')
        queueList.update({nodeId:{'SampleId': id, 'QueueId': nodeId, 'methods':[]}})
        queueOrder.append(nodeId)
        return jsonify({'SampleId': id, 'QueueId': nodeId} )
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample could not be added')
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

###Adding methods to a sample
@mxcube.route("/mxcube/api/v0.1/queue/<id>/addmethod/centring", methods=['PUT', 'POST'])
def addCentring(id):
    '''
    Add a centring method to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "CentringId": newId}
    '''
    #no data received yet
    try:
        centNode = qmo.SampleCentring()
        centEntry = qe.SampleCentringQueueEntry()
        centEntry.set_data_model(centNode)

        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), centNode) #add_child does not return id!
        entry.enqueue(centEntry)
        queueList[int(id)]['methods'].append({'CentringId':newNode})
        logging.getLogger('HWR').info('[QUEUE] centring added to sample')
        resp = jsonify({'CentringId':newNode})
        resp.status_code = 200
        return resp
    except Exception as ex:
        logging.getLogger('HWR').exception('[QUEUE] centring could not be added to sample')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>/addmethod/characterisation", methods=['PUT', 'POST'])
def addCharacterisation(id):
    '''
    Add a characterisation method to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
            id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "CharacId": newId}    '''
    #no data received yet
    try:
        characNode = qmo.Characterisation()
        characEntry = qe.CharacterisationQueueEntry()
        characEntry.set_data_model(characNode)

        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), characNode) #add_child does not return id!
        entry.enqueue(characEntry)
        queueList[int(id)]['methods'].append({'CharacId':newNode})
        logging.getLogger('HWR').info('[QUEUE] characterisation added to sample')
        resp = jsonify({'CharacId':newNode})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] characterisation could not be added to sample')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>/addmethod/datacollection", methods=['PUT', 'POST'])
def addDataCollection(id):
    '''
    Add a data collection method to the sample with id: <id>, integer.
    Args: id, current id of the sample where add the method
        id: int (parsed to int anyway)
    Return: command sent successfully? http status response, 200 ok, 409 something bad happened. Plus:
       data ={ "ColId": newId}    '''
    #no data received yet
    try:
        colNode = qmo.Characterisation()
        colEntry = qe.CharacterisationQueueEntry()
        colEntry.set_data_model(colNode)

        node = mxcube.queue.get_node(int(id))
        entry = mxcube.queue.queue_hwobj.get_entry_with_model(node)
        newNode = mxcube.queue.add_child_at_id(int(id), colNode) #add_child does not return id!
        entry.enqueue(colEntry)
        queueList[int(id)]['methods'].append({'ColId':newNode})
        logging.getLogger('HWR').info('[QUEUE] datacollection added to sample')
        resp = jsonify({'ColId':newNode})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] datacollection could not be added to sample')
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
            resp = jsonify(queueList[int(i)])
            resp.status_code = 200
            return resp
    except Exception:
        logging.getLogger('HWR').exception('[QUEUE] sample info could not be retrieved')
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
