from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from flask import Response, jsonify, request, make_response

from mxcube3 import server
from mxcube3 import blcontrol
from mxcube3.core import beamlineutils


@server.route("/mxcube/api/v0.1/beamline", methods=["GET"])
@server.restrict
def beamline_get_all_attributes():
    return jsonify(beamlineutils.beamline_get_all_attributes())


@server.route("/mxcube/api/v0.1/beamline/<name>/abort", methods=["GET"])
@server.require_control
@server.restrict
def beamline_abort_action(name):
    """
    Aborts an action in progress.

    :param str name: Owner / Actuator of the process/action to abort

    Replies with status code 200 on success and 520 on exceptions.
    """
    try:
        beamlineutils.beamline_abort_action(name)
    except Exception:
        err = str(sys.exc_info()[1])
        return make_response(err, 520)
    else:
        logging.getLogger("user_level_log").error("Aborting set on %s." % name)
        return make_response("", 200)


@server.route("/mxcube/api/v0.1/beamline/<name>/run", methods=["POST"])
@server.require_control
@server.restrict
def beamline_run_action(name):
    """
    Starts a beamline action; POST payload is a json-encoded object with
    'parameters' as a list of parameters

    :param str name: action to run

    Replies with status code 200 on success and 520 on exceptions.
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


@server.route("/mxcube/api/v0.1/beamline/<name>", methods=["PUT"])
@server.require_control
@server.restrict
def beamline_set_attribute(name):
    """
    Tries to set < name > to value, replies with the following json:

        {name: < name > , value: < value > , msg: < msg > , state: < state >

    Where msg is an arbitrary msg to user, state is the internal state
    of the set operation(for the moment, VALID, ABORTED, ERROR).

    Replies with status code 200 on success and 520 on exceptions.
    """
    param = json.loads(request.data)
    res, data = beamlineutils.beamline_set_attribute(name, param)

    if res:
        code = 200
    else:
        code = 520

    response = jsonify(data)
    response.code = code
    return response


@server.route("/mxcube/api/v0.1/beamline/<name>", methods=["GET"])
@server.restrict
def beamline_get_attribute(name):
    """
    Retrieves value of attribute < name > , replies with the following json:

        {name: < name > , value: < value > , msg: < msg > , state: < state >

    Where msg is an arbitrary msg to user, state is the internal state
    of the get operation(for the moment, VALID, ABORTED, ERROR).

    Replies with status code 200 on success and 520 on exceptions.
    """
    res, data = beamlineutils.beamline_get_attribute(name)

    response = jsonify(data)
    response.code = res
    return response


@server.route("/mxcube/api/v0.1/beam/info", methods=["GET"])
@server.restrict
def get_beam_info():
    """
    Beam information: position, size, shape
    return_data = {"position": , "shape": , "size_x": , "size_y": }
    """
    return jsonify(beamlineutils.get_beam_info())


@server.route("/mxcube/api/v0.1/beamline/datapath", methods=["GET"])
@server.restrict
def beamline_get_data_path():
    """
    Retrieve data directory from the session hwobj,
    this is specific for each beamline.
    """
    data = blcontrol.beamline.session.get_base_image_directory()
    return jsonify({"path": data})


@server.route("/mxcube/api/v0.1/beamline/prepare_beamline", methods=["PUT"])
@server.require_control
@server.restrict
def prepare_beamline_for_sample():
    """
    Prepare the beamline for a new sample.
    """
    try:
        beamlineutils.prepare_beamline_for_sample()
    except Exception:
        msg = "Cannot prepare the Beamline for a new sample"
        logging.getLogger("HWR").error(msg)
        return Response(status=200)
    return Response(status=200)
