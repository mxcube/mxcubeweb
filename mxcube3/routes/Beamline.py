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
def beamline_get_all_attributes():
    ho = BeamlineSetupMediator(mxcube.beamline)
    data = ho.dict_repr()
    return Response(json.dumps(data), status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>/abort", methods=['GET'])
def beamline_abort_process(name):
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())
    ho.abort()
    return Response('', status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['PUT'])
def beamline_set_attribute(name):
    data = json.loads(request.data)
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())

    try:
        data["value"] = ho.set(data["value"])
        data["status"] = "VALID"
        data["msg"] = ""
        result, code = json.dumps(data), 200
    except Exception as ex:
        data["value"] = ho.get()
        data["status"] = "ABORTED"
        data["msg"] = str(ex)
        result, code = json.dumps(data), 520

    return Response(result, status=code, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['GET'])
def beamline_get_attribute(name):
    value = 2
    print("/mxcube/api/v0.1/beamline/%s/" % (name))
    data = {"name": name, "value":value}
    return Response(json.dumps(data), status=200, mimetype='application/json')
