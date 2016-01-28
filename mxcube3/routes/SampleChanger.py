from flask import session, redirect, url_for, render_template, request, Response, jsonify
from mxcube3 import app as mxcube
import logging
import itertools
from .Queue import queueList, lastQueueNode

@mxcube.route("/mxcube/api/v0.1/sample_changer/samples_list", methods=['GET'])
def get_samples_list():
    samples_list = mxcube.sample_changer.getSampleList()
    samples = {}
    for s in samples_list:
        sample_dm = s.getID() or ""
        samples.update({s.getAddress(): { "id": s.getAddress(), "location": ":".join(map(str, s.getCoords())), "code": sample_dm, "methods": {} } })

    return jsonify(samples)

@mxcube.route("/mxcube/api/v0.1/sample_changer/<sample>/mount", methods=['PUT'])
def mountSample(sample):
	try:
		sampleNode = mxcube.queue.get_node(int(sample))
		sampleLocation = sampleNode.location
		lastQueueNode.update({'id' : int(sample), 'sample':str(sampleLocation[0]+':'+sampleLocation[1])})
		#mxcube.sample_changer.load_sample
		#TODO: figure out how to identify the sample for the sc, selectsample&loadsamplae&etc
		logging.getLogger('HWR').info('[SC] %s sample mounted, location: %s' %(sample, sampleLocation))
		return Response(status = 200)
	except Exception:
		logging.getLogger('HWR').exception('[SC] sample could not be mounted')
		return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/sample_changer/<sample>/unmount", methods=['PUT'])
def unmountSample(sample):
	try:
		sampleNode = mxcube.queue.get_node(int(sample))
		sampleLocation = sampleNode.location
		#mxcube.sample_changer.load_sample
		#TODO: figure out how to identify the sample for the sc, selectsample&loadsamplae&etc
		logging.getLogger('HWR').info('[SC] %s sample mounted, location: %s' %(sample, sampleLocation))
		return Response(status = 200)
	except Exception:
		logging.getLogger('HWR').exception('[SC] sample could not be mounted')
		return Response(status = 409)
