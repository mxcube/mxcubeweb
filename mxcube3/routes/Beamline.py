import json

from flask import request, Response
from mxcube3 import app as mxcube
from mxcube3 import socketio
from mxcube3.ho_mediators.beamline_setup import BeamlineSetupMediator


@socketio.on('connect', namespace='/beamline/energy')
def connect():
    # this is needed to create the namespace, and the actual connection
    # to the server, but we don't need to do anything more
    pass


@mxcube.route("/mxcube/api/v0.1/beamline", methods=['GET'])
def get_beamline_attributes():
    ho = BeamlineSetupMediator(mxcube.beamline)
    data = ho.dict_repr()
    return Response(json.dumps(data), status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['PUT'])
def set_beamline_attribute(name):
    data = json.loads(request.data)
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())
    data["value"] = ho.set(data["value"], None)
    return Response(json.dumps(data), status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['GET'])
def get_beamline_attribute(name):
    value = 2
    print("/mxcube/api/v0.1/beamline/%s/" % (name))
    data = {"name": name, "value":value}
    return Response(json.dumps(data), status=200, mimetype='application/json')
