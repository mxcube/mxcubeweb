import json
import logging
import signals
from flask import Response, jsonify, request

from mxcube3 import app as mxcube

from mxcube3.ho_mediators.beamline_setup import BeamlineSetupMediator

def init_signals():
    try: 
        beamInfo = mxcube.beamline.getObjectByRole("beam_info")
        if beamInfo is not None:
            for sig in signals.beam_signals:
                beamInfo.connect(beamInfo, sig, signals.beam_changed)
        else:
            logging.getLogger('HWR').error("beam_info is not defined")
    except Exception, ex: 
        logging.getLogger('HWR').\
            error("error loading beam_info hwo is not defined (%s)" % str(ex))

    try: 
        machInfo = mxcube.beamline.getObjectByRole("mach_info")
        if machInfo is not None:
            machInfo.connect(machInfo, 'machInfoChanged',
                           signals.mach_info_changed)
        else:
            logging.getLogger('HWR').error("mach_info is not defined")
    except Exception, ex: 
        logging.getLogger('HWR').\
            error("error loading mach_info hwo is not defined (%s)" % str(ex))


@mxcube.route("/mxcube/api/v0.1/beamline", methods=['GET'])
def beamline_get_all_attributes():
    ho = BeamlineSetupMediator(mxcube.beamline)
    data = ho.dict_repr()
    data.update({'path': mxcube.session.get_base_image_directory()})
    return Response(json.dumps(data), status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>/abort", methods=['GET'])
def beamline_abort_action(name):
    """
    Aborts an action in progress.

    :param str name: Owner / Actuator of the process/action to abort
    """
    # This could be made to give access to arbitrary method of HO, possible
    # security issues to be discussed.
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())
    ho.stop()

    return Response('', status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['PUT'])
def beamline_set_attribute(name):
    """
    Tries to set <name> to value, replies with the following json:

        {name: <name>, value: <value>, msg: <msg>, state: <state>

    Where msg is an arbitrary msg to user, state is the internal state
    of the set operation (for the moment, VALID, ABORTED, ERROR).

    Replies with status code 200 on success and 520 on exceptions.
    """
    data = json.loads(request.data)
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())

    try:
        ho.set(data["value"])
        data = ho.dict_repr()
        result, code = json.dumps(data), 200
    except Exception as ex:
        data["value"] = ho.get()
        data["state"] = "UNUSABLE"
        data["msg"] = str(ex)
        result, code = json.dumps(data), 520

    return Response(result, status=code, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['GET'])
def beamline_get_attribute(name):
    """
    Retrieves value of attribute <name>, replies with the following json:

        {name: <name>, value: <value>, msg: <msg>, state: <state>

    Where msg is an arbitrary msg to user, state is the internal state
    of the get operation (for the moment, VALID, ABORTED, ERROR).

    Replies with status code 200 on success and 520 on exceptions.
    """
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())
    data = {"name": name, "value": ""}

    try:
        data = ho.dict_repr()
    except Exception as ex:
        data["value"] = ""
        data["state"] = "UNUSABLE"
        data["msg"] = str(ex)
        result, code = json.dumps(data), 520

    return Response(json.dumps(data), status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/beam/info", methods=['GET'])
def get_beam_info():
    """Beam information: position,size,shape
    return_data={"position":,"shape":,"size_x":,"size_y":}
    """
    ret = {}

    beam_info = mxcube.beamline.getObjectByRole("beam_info")

    if beam_info is None:
        logging.getLogger('HWR').error("beamInfo is not defined")
        return Response(status=409)

    try:
        beam_info_dict = beam_info.get_beam_info()
    except Exception:
        beam_info_dict = dict()

    try:
        aperture = mxcube.diffractometer.getObjectByRole('aperture')
        aperture_list = aperture.getPredefinedPositionsList()
        current_aperture = aperture.getCurrentPositionName()
    except Exception:
        logging.getLogger('HWR').exception('could not get all Aperture hwobj')
        aperture_list = []
        current_aperture = None

    ret.update({'position': beam_info.get_beam_position(),
                'shape': beam_info_dict.get("shape"),
                'size_x': beam_info_dict.get("size_x"),
                'size_y': beam_info_dict.get("size_y"),
                'apertureList': aperture_list,
                'currentAperture': current_aperture})
    resp = jsonify(ret)
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/beamline/datapath", methods=['GET'])
def beamline_get_data_path():
    """
    Retrieve data directory from the session hwobj,
    this is specific for each beamline.
    """
    data = mxcube.session.get_base_image_directory()
    return Response(json.dumps(data), status=200, mimetype='application/json')


@mxcube.route("/mxcube/api/v0.1/machinfo/", methods=['GET'])
def mach_info_get():
    """
    Get machine information from machine control system

    :returns: Response object with values, status code set to:
              200: On success
              409: Error getting information 
    """
    try:
        values = mxcube.machinfo.get_values(False)
        resp = jsonify({'values': values})
        resp.status_code = 200
    except Exception as ex:
        logging.getLogger('HWR').info('[MACHINFO] Cannot read values ')
        resp = Response()
        resp.status_code = 409
    
    return resp

