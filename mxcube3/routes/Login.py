from flask import session, request, jsonify
from mxcube3 import app as mxcube
import logging
import os
import types


def convert_to_dict(ispyb_object):
    d = {}
    if type(ispyb_object) == types.DictType:
        d.update(ispyb_object)
    else:
        for key in ispyb_object.__keylist__:
            val = getattr(ispyb_object, key)
            if type(val) == types.InstanceType:
                val = convert_to_dict(val)
            elif type(val) == types.ListType:
                val = [convert_to_dict(x) if type(x) == types.InstanceType else x for x in val]
            elif type(val) == types.DictType:
                val = dict([(k, convert_to_dict(x) if type(x) == types.InstanceType else x) for k, x in val.iteritems()])
            d[key] = val
    return d

@mxcube.route("/mxcube/api/v0.1/login", methods=["POST"])
def login():
#    beamline_name = os.environ.get("SMIS_BEAMLINE_NAME")
    content = request.get_json()
    loginID = content['proposal']
    password = content['password']
    logging.getLogger('HWR').info(loginID)

    loginRes = mxcube.db_connection.login(loginID, password)
    if loginRes['status']['code'] == 'ok':
        session['proposal_id'] = loginID
        session['loginInfo'] = { 'loginID': loginID, 'password': password, 'loginRes': loginRes }
        mxcube.session.proposal_id = loginID #do we still need this?
#        loginRes structure
#        {'status':{ "code": "ok", "msg": msg }, 'Proposal': proposal,
#        'session': todays_session,
#        "local_contact": self.get_session_local_contact(todays_session['session']['sessionId']),
#        "person": prop['Person'],
#        "laboratory": prop['Laboratory']}
    return jsonify(convert_to_dict(loginRes))

@mxcube.route("/mxcube/api/v0.1/signout")
def signout():
    session['loginInfo'] = None
    session['queueList'] = None
    return ""

# information to display on the login page
@mxcube.route("/mxcube/api/v0.1/login_info", methods=["GET"])
def loginInfo():
    synchrotron_name = mxcube.session.synchrotron_name
    beamline_name = mxcube.session.beamline_name
    loginType = mxcube.db_connection.loginType.title()

    loginInfo = session.get("loginInfo")
    if loginInfo is None:
        session["queueList"] = {}
    else:
        loginInfo["loginRes"] = mxcube.db_connection.login(loginInfo["loginID"], loginInfo["password"])
        session['loginInfo'] = loginInfo
 
    return jsonify(
                    {"synchrotron_name": synchrotron_name,
                    "beamline_name": beamline_name,
                    "loginType": loginType,
                    "loginRes": convert_to_dict(loginInfo["loginRes"] if loginInfo is not None else {})
                    }
                   )

@mxcube.route("/mxcube/api/v0.1/initialstatus", methods=["GET"])
def get_initial_state():
    """
    Get status, positions of moveables, sample image data ...
    Args: None
    Return: {   Moveable1:{'Status': status, 'position': position},
               ...,
                MoveableN:{'Status': status, 'position': position}
            } plus status code 200
        status: str
        position: float
        moveables: 'Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'

    """
    motors = ['Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'] 
    #'Kappa', 'Kappa_phi',
    data = {}
    try:
        for mot in motors:
            motor_hwobj = mxcube.diffractometer.getObjectByRole(mot.lower())
            if motor_hwobj is not None:
                if mot == 'Zoom':
                    pos = motor_hwobj.predefinedPositions[motor_hwobj.getCurrentPositionName()]
                    status = "unknown"
                elif mot == 'BackLightSwitch' or mot == 'FrontLightSwitch':
                    states = {"in": 1, "out": 0}
                    pos = states[motor_hwobj.getActuatorState()]  # {0:"out", 1:"in", True:"in", False:"out"}
                    # 'in', 'out'
                    status = pos 
                else:
                    try:
                        pos = motor_hwobj.getPosition()
                        status = motor_hwobj.getState()
                    except Exception:
                        logging.getLogger('HWR').exception('[SAMPLEVIEW] could not get "%s" motor' %mot)
                data[mot] = {'Status': status, 'position': pos}
        data['Camera'] = {'pixelsPerMm': mxcube.diffractometer.get_pixels_per_mm(),
            'imageWidth':  mxcube.diffractometer.image_width,
            'imageHeight':  mxcube.diffractometer.image_height,
            }
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could not get all motor  status')
        return Response(status=409)

### TODO: when we have the main login page this method should redirect to '/'

@mxcube.route("/mxcube/api/v0.1/samples/<proposal_id>")
def proposal_samples(proposal_id):
    # session_id is not used, so we can pass None as second argument to 'db_connection.get_samples'
    samples_info_list = [convert_to_dict(x) for x in mxcube.db_connection.get_samples(proposal_id, None)]

    for sample_info in samples_info_list:
        try:
            basket = int(sample_info["containerSampleChangerLocation"])
        except (TypeError, ValueError):
            continue
        else:
            if mxcube.sample_changer.__class__.__TYPE__ == 'Robodiff':
                cell = int(round((basket+0.5)/3.0))
                puck = basket-3*(cell-1)
                sample_info["containerSampleChangerLocation"] = "%d:%d" % (cell, puck)

    return jsonify({"samples_info": samples_info_list})
