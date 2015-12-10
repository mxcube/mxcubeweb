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
    Return: boolean, success?
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to start')
    try:
    	mxcube.queue.start()
    	logging.getLogger('HWR').info('[QUEUE] Queue started')
        return Response(status=200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be started')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/stop", methods=['PUT'])
def queueStop():
    """Queue: stop execution of the queue
    Args: None
    Return: boolean, success?
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to stop')
    try:
    	mxcube.queue.stop()
    	logging.getLogger('HWR').info('[QUEUE] Queue stopped')
        return Response(status = 200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be stopped')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/abort", methods=['PUT'])
def queueAbort():
    """Queue: abort execution of the queue
    Args: None
    Return: boolean, success?
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to abort')
    try:
        mxcube.queue.abort()
        logging.getLogger('HWR').info('[QUEUE] Queue aborted')
        return Response(status = 200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be aborted')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/pause", methods=['PUT'])
def queuePause():
    """Queue: start execution of the queue
    Args: None
    Return: boolean, success?
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to pause')
    try:
        mxcube.queue.pause()
        logging.getLogger('HWR').info('[QUEUE] Queue paused')
        return Response(status = 200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be paused')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/clear", methods=['PUT'])
def queueClear():
    """Queue: clear the queue
    Args: None
    Return: boolean, success?
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to clear')
    try:
        mxcube.queue.clear_model(mxcube.queue.get_model_root()._name)#model name?? rootNode?
        #mxcube.queue.queue_hwobj.clear()#already done in the previous call
        logging.getLogger('HWR').info('[QUEUE] Queue cleared')
        return Response(status = 200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be cleared')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue", methods=['GET'])
def queueGet():
    """Queue: get the queue
    Args: None
    Return: a lits of queue entries
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting data')
    try:
        resp = jsonify(queueList)
        resp.status_code = 200
        return resp
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/queue/save", methods=['GET'])
def queueSave():
    """Queue: save the queue
    Args: None
    Return: True/False
    """
    logging.getLogger('HWR').info('[QUEUE] Queue saving')
    filename = os.path.join(os.path.dirname(os.path.abspath(__file__)),'queue-backup.txt')
    try:
        f = open(filename, 'w')
        tofile = json.dumps(queueList) 
        f.write(tofile)
        f.close()
        return Response(status = 200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could saved')
        return Response(status = 409)
        
@mxcube.route("/mxcube/api/v0.1/queue/entry/", methods=['GET'])
def getCurrentEntry():
    """Queue: get current entry
    Args: None
    Return:    The currently executing QueueEntry:
                :rtype: QueueEntry
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting current entry')
    try:
        return mxcube.queue.get_current_entry()
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get current entry')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/entry/", methods=['PUT'])
def setCurrentEntry(entry):
    """Queue: Sets the currently executing QueueEntry to <entry>.
    Args: None
    Return:    The currently executing QueueEntry:
                :rtype: QueueEntry
    """
    logging.getLogger('HWR').info('[QUEUE] Queue getting current entry')
    try:
        return mxcube.queue.set_current_entry(entry)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not get current entry')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<entry>/execute", methods=['PUT'])
def executeEntryWithId(entry):
    """Queue: start execution of the queue
    Args: None
    Return: boolean, success?
    """
    logging.getLogger('HWR').info('[QUEUE] Queue going to execute entry with id: %s' %id)
    try:
        mxcube.queue.execute_entry(entry)
        logging.getLogger('HWR').info('[QUEUE] Queue executing entry with id: %s' %id)
        return Response(status = 200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queue could not be started')
        return Response(status = 409)

###----QUEUE ELEMENTs MANAGEMENT----###
## Deprecating Sample.py
###----SAMPLE----###
import queue_entry as qe
from queue_entry import QueueEntryContainer

@mxcube.route("/mxcube/api/v0.1/queue/add/<id>", methods=['POST','PUT'])
def addSample(id):
    '''id in the form of '1:01'
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
    except:
        logging.getLogger('HWR').error('[QUEUE] sample could not be added')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['DELETE'])
def deleteSample(id):
    """id in the form of node id, integer"""
    try:
        nodeToRemove = mxcube.queue.get_node(int(id))
        mxcube.queue.del_child(nodeToRemove.get_parent(), nodeToRemove)
        entryToRemove = mxcube.queue.queue_hwobj.get_entry_with_model(nodeToRemove)
        mxcube.queue.queue_hwobj.dequeue(entryToRemove)
        queueList.pop(int(id))
        queueOrder.remove(nodeId)
        return Response(status = 200)
    except:
        logging.getLogger('HWR').error('[QUEUE] Queued sample could not be deleted')
        return Response(status = 409)
###Adding methods to a sample
@mxcube.route("/mxcube/api/v0.1/queue/<id>/addmethod/centring", methods=['PUT', 'POST'])
def addCentring(id):
    '''
    Add method to the sample with id: <id>, integer
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
        resp = jsonify({'centringId':newNode})
        resp.status_code = 200
        return resp
    except Exception as ex:
        print ex
        logging.getLogger('HWR').info('[QUEUE] centring could not be added to sample')
        return Response(status = 409)
@mxcube.route("/mxcube/api/v0.1/queue/<id>/addmethod/characterisation", methods=['PUT', 'POST'])
def addCharacterisation(id):
    '''
    Add method to the sample with id: <id>, integer
    '''
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
    except Exception as ex:
        print ex
        logging.getLogger('HWR').info('[QUEUE] characterisation could not be added to sample')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>/addmethod/datacollection", methods=['PUT', 'POST'])
def addDataCollection(id):
    '''
    Add method to the sample with id: <id>, integer
    '''
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
    except Exception as ex:
        print ex
        logging.getLogger('HWR').info('[QUEUE] datacollection could not be added to sample')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/queue/<id>", methods=['GET'])
def getSample(id):
    """Get the information of the sample with id:"id"
    data = {generic_data, "SampleId":id}
    return_data={"SampleId":id, sample_data={'holderLength': 22.0, 'code': None, 'containerSampleChangerLocation': '1', 'proteinAcronym': 'Mnth', 'cellGamma': 0.0, 'cellAlpha': 0.0, 'sampleId': 444179, 'cellBeta': 0.0, 'crystalSpaceGroup': 'R32', 'sampleLocation': '2', 'sampleName': 'sample-E02', 'cellA': 0.0, 'diffractionPlan': {}, 'cellC': 0.0, 'cellB': 0.0, 'experimentType': 'Default'}}
    """
    try:
        if not queueList[int(id)]:
            logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
            return Response(status = 409)
        else:
            resp = jsonify(queueList[int(i)])
            resp.status_code = 200
            return resp
    except:
        logging.getLogger('HWR').error('[QUEUE] sample info could not be retrieved')
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
