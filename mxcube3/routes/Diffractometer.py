from flask import session, request, Response, jsonify
from mxcube3 import app as mxcube
import json
import logging

@mxcube.route("/mxcube/api/v0.1/diffractometer/phase", methods=['PUT'])
def set_phase():
    """
    set_phase: set the diffractometer phase
    available phases: Centring, BeamLocation, DataCollection, Transfer
    """
    params = request.data
    params = json.loads(params)
    phase = params['phase']
    try:
        mxcube.diffractometer.set_phase(phase)
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('Could not change the diffractometer phase to ' % phase)
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/diffractometer/usesc", methods=['GET'])
def get_use_sc():
    """
    use_sample_changer: set use_sample_changer
    data = { "use_sc": , "msg":}
    return_data: data plus error code 200/409
    """
    try:
        resp = jsonify({'use_sc': mxcube.diffractometer.use_sc })
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('Could not get use_sc mode')
        return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/diffractometer/usesc", methods=['PUT'])
def use_sc():
    """
    use_sample_changer: set use_sample_changer
    data = { "use_sc": , "msg":}
    return_data: data plus error code 200/409
    """
    params = request.data
    params = json.loads(params)
    use_sc = params['use_sc']
    try:
        if use_sc:
            # to make sure that the TransferMode in MD is set to SAMPLE_CHANGER
            transfer_mode = mxcube.diffractometer.get_transfer_mode()
            print transfer_mode
            if transfer_mode != "SAMPLE_CHANGER":
                logging.getLogger('HWR').error("Set the diffractometer TransferMode to SAMPLE_CHANGER first!!")
                resp.status_code = 409
                return resp
            else:
                mxcube.diffractometer.set_use_sc (True)
        else:
            mxcube.diffractometer.set_use_sc (False)
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('Could not set use_sample_changer mode')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/diffractometer/platemode", methods=['GET'])
def md_in_plate_mode():
    """
    md_in_plate_mode: check if diffractometer is in plate mode or not
    data = {"md_in_plate_mode": } True /False
    return_data: data plus error code 200/409
    """
    try:
        md_in_plate_mode = mxcube.diffractometer.in_plate_mode()
        resp = jsonify({'md_in_plate_mode':md_in_plate_mode})
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('Could not get the head type of the diffractometer')
        return Response(status=409)
