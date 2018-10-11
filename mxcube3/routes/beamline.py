import sys
import json
import logging

from flask import Response, jsonify, request, make_response

from mxcube3 import server

from mxcube3 import blcontrol
from mxcube3.core import beamlineutils

ROUTE_PREFIX = "/mxcube/api/v0.1/beamline"


@server.route(ROUTE_PREFIX, methods=['GET'])
@server.restrict
def beamline_get_all_attributes():
    ret = beamlineutils.beamline_get_all_attributes()
    return jsonify(ret)


@server.route(ROUTE_PREFIX + "/procedure/<name>/abort", methods=['GET'])
@server.restrict
def beamline_abort_action(name):
    """
    Aborts an action in progress.

    :param str name: Owner / Actuator of the process/action to abort

    :statuscode: 200: No error
    :statuscode: 520: On Exception
    """
    try:
        beamlineutils.beamline_abort_action(name)
    except Exception:
        err = str(sys.exc_info()[1])
        return make_response(err, 520)
    else:
        logging.getLogger('user_level_log').error('Aborting set on %s.' % name)
        return make_response("", 200)


@server.route(ROUTE_PREFIX + "/procedure/<name>/run", methods=['POST'])
@server.restrict
def beamline_run_action(name):
    """
    Starts a beamline action; POST payload is a json-encoded object with
    'parameters' as a list of parameters

    :param str name: action to run

    :statuscode: 200: No error
    :statuscode: 520: On Exception
    """
    try:
        params = request.get_json()["parameters"]
    except Exception:
        params = []

    try:
        beamlineutils.beamline_run_action(name, params)
    except Exception as ex:
        return make_response(str(ex), 520)
    else:
        return make_response("{}", 200)


@server.route(ROUTE_PREFIX + "/movable/<name>/<pos>", methods=['PUT'])
@server.restrict
def set_movable(name, pos):
    """
    Move movable with name <name> to position <pos>

    :parameter str name: The motor name for instance: 'Phi', 'Focus', 'PhiZ',
                         'PhiY', 'Zoom', 'BackLightSwitch','BackLight',
                         'FrontLightSwitch', 'FrontLight' Sampx', 'Sampy'

    :parameter float pos: new position

    :statuscode: 200: No error
    :statuscode: 409: On Exception
    """

    try:
        data = beamlineutils.set_movable(name, pos)
    except Exception as ex:
        return Response('Could not move movable %s' % str(ex),
                        status=409,
                        mimetype='application/json')
    else:
        response = jsonify(data)
        response.code = 200
        return response


@server.route(ROUTE_PREFIX + "/movable/<name>/stop", methods=['PUT'])
def stop_movable(name):
    """
    Stop movable with name <name>

    :parameter str name: The movable name for instance: 'Phi', 'Focus', 'PhiZ',
                         'PhiY', 'Zoom', 'BackLightSwitch','BackLight',
                         'FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'
    :statuscode: 200: No error
    :statuscode: 409: On exception
    """
    try:
        beamlineutils.stop_movable(name)
        return Response(status=200)
    except Exception:
        return Response(status=409)


@server.route(ROUTE_PREFIX + "/movable/<name>", methods=['GET'])
@server.restrict
def get_movable(name):
    """
    Get position and state of movable with name <name>

    :parameter str name: Name of movable for instance, 'Phi', 'Focus', 'PhiZ',
                         'PhiY', 'Zoom', 'BackLightSwitch','BackLight',
                         'FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'

    :response Content-type: application/json,
                            { name:  { 'state': state,
                                       'position': position }}
    :statuscode: 200: No error
    :statuscode: 409: On exception

    """
    try:
        ret = beamlineutils.get_movable(name)
        resp = jsonify(ret)
        resp.status_code = 200
        return resp
    except Exception:
        return Response(status=409)


@server.route(ROUTE_PREFIX + "/movables", methods=['GET'])
@server.restrict
def get_all_movables():
    ret = beamlineutils.get_all_movables()
    resp = jsonify(ret)
    resp.status_code = 200
    return resp


@server.route(ROUTE_PREFIX + "/datapath", methods=['GET'])
@server.restrict
def beamline_get_data_path():
    """
    Retrieve data directory from the session hwobj,
    this is specific for each beamline.
    """
    data = blcontrol.session.get_base_image_directory()
    return jsonify({"path": data})


@server.route(ROUTE_PREFIX + "/prepare_beamline", methods=['PUT'])
@server.restrict
def prepare_beamline_for_sample():
    """
    Prepare the beamline for a new sample.
    """
    try:
        beamlineutils.prepare_beamline_for_sample()
    except Exception:
        msg = 'Cannot prepare the Beamline for a new sample'
        logging.getLogger('HWR').error(msg)
        return Response(status=200)
    return Response(status=200)


@server.route("/mxcube/api/v0.1/beam/info", methods=['GET'])
@server.restrict
def get_beam_info():
    """
    Beam information: position, size, shape
    return_data = {"position": , "shape": , "size_x": , "size_y": }
    """
    return jsonify(beamlineutils.get_beam_info())
