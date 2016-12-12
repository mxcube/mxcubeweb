from flask import Response, jsonify, request, session
from mxcube3 import app as mxcube
from mxcube3.routes import Utils

import json
import logging


@mxcube.route("/mxcube/api/v0.1/diffractometer/phase", methods=['GET'])
def get_phase():
    """
    Retrieve the current phase in the diffractometer.
        :response Content-type: application/json, example:
            {'current_phase': 'Centring'},
            available phases: [Centring, BeamLocation, DataCollection, Transfer]
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    resp = jsonify({'current_phase': mxcube.diffractometer.get_current_phase()})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/diffractometer/phaselist", methods=['GET'])
def get_phase_list():
    """
    Retrieve the available phases in the diffractometer.
        :response Content-type: application/json,
            example: {'phase_list': [Centring, BeamLocation, DataCollection, Transfer]}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    resp = jsonify({'current_phase': mxcube.diffractometer.get_phase_list()})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/diffractometer/phase", methods=['PUT'])
def set_phase():
    """
    Set the phase in the diffractometer.
        :request Content-type: application/json, an object containing
            the new phase as string, e.g. {'phase': 'Centring'}.
            [Centring, BeamLocation, DataCollection, Transfer]
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    params = request.data
    params = json.loads(params)
    phase = params['phase']
    try:
        mxcube.diffractometer.wait_device_ready(30)
    except Exception:
        logging.getLogger('HWR').warning('diffractometer might not be ready')
    mxcube.diffractometer.set_phase(phase)
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/diffractometer/platemode", methods=['GET'])
def md_in_plate_mode():
    """
    md_in_plate_mode: check if diffractometer is in plate mode or not
    data = {"md_in_plate_mode": } True /False
    return_data: data plus error code 200/409
    """
    md_in_plate_mode = mxcube.diffractometer.in_plate_mode()
    resp = jsonify({'md_in_plate_mode': md_in_plate_mode})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/diffractometer/movables/state", methods=['GET'])
def get_movables_state():
    ret = Utils.get_centring_motors_info()

    ret.update(Utils.get_light_state_and_intensity())

    resp = jsonify(ret)
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/diffractometer/aperture", methods=['PUT'])
def set_aperture():
    """
    Move the aperture motor.
        :request Content-type: application/json, new position {'diameter': 50}.
            Note: level specified as integer (not 'Diameter 50')
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    params = request.data
    params = json.loads(params)
    new_pos = params['diameter']
    aperture_motor = mxcube.diffractometer.getObjectByRole('aperture')
    logging.getLogger('HWR').info("Changing aperture diameter to: %s" % new_pos)
    aperture_motor.moveToPosition(int(new_pos))

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/diffractometer/aperture", methods=['GET'])
def get_aperture():
    ret = {}

    aperture = mxcube.diffractometer.getObjectByRole('aperture')
    aperture_list = aperture.getPredefinedPositionsList()
    current_aperture = aperture.getCurrentPositionName()

    ret.update({'apertureList': aperture_list,
                'currentAperture': current_aperture
                })

    resp = jsonify(ret)
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/diffractometer/info", methods=['GET'])
def get_diffractometer_info():
    ret = {}

    try:
        ret['useSC'] = mxcube.diffractometer.use_sc
    except AttributeError:
        ret['useSC'] = False  # in case the diff does not have this implemented

    try:
        ret['currentPhase'] = mxcube.diffractometer.current_phase
    except AttributeError:
        ret['currentPhase'] = 'None'  # in case the diff does not have this implemented

    try:
        ret['phaseList'] = mxcube.diffractometer.get_phase_list()
    except AttributeError:
        ret['phaseList'] = []  # in case the diff does not have this implemented


    resp = jsonify(ret)
    resp.status_code = 200
    return resp
