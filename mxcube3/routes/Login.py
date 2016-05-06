from flask import session, request, jsonify, Response
from mxcube3 import app as mxcube
from mxcube3.routes import Queue
import logging
import os, jsonpickle
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
    """
    Login into mxcube application.
        :form proposal: proposal as it appears in duo
        :form password: corresponding password
        :response Content-Type: application/json, an object containing following info: {'status':{ "code": "ok", "msg": msg }, 'Proposal': proposal, 'session': todays_session, "local_contact": local_contact, "person": someone, "laboratory": a_laboratory']}
        :statuscode: 200: no error
        :statuscode: 409: could not log in
    """
    content = request.get_json()
    loginID = content['proposal']
    password = content['password']
    loginRes = mxcube.db_connection.login(loginID, password)
   
    if loginRes['status']['code'] == 'ok':
        session['loginInfo'] = { 'loginID': loginID, 'password': password, 'loginRes': loginRes }
#        loginRes structure
#        {'status':{ "code": "ok", "msg": msg }, 'Proposal': proposal,
#        'session': todays_session,
#        "local_contact": self.get_session_local_contact(todays_session['session']['sessionId']),
#        "person": prop['Person'],
#        "laboratory": prop['Laboratory']}

    return make_response(loginRes['status']['code'], 200)

@mxcube.route("/mxcube/api/v0.1/signout")
def signout():
    """
    Signout from Mxcube3 and clean the session
    """
    session['loginInfo'] = None
    session['queueList'] = None
    return ""

# information to display on the login page
@mxcube.route("/mxcube/api/v0.1/login_info", methods=["GET"])
def loginInfo():
    """
    Retrieve sessoin/login info
     :response Content-Type: application/json, {"synchrotron_name": synchrotron_name, "beamline_name": beamline_name,
                    "loginType": loginType, "loginRes": {'status':{ "code": "ok", "msg": msg }, 'Proposal': proposal, 'session': todays_session, "local_contact": local_contact, "person": someone, "laboratory": a_laboratory']} }
    """
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
    Get status, positions of moveables, sample image data ... Where moveables: 'Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'.
        :response Content-Type: application/json,  {   Moveable1:{'Status': status, 'position': position},
               ..., MoveableN:{'Status': status, 'position': position}
            }
        :statuscode: 200: no error
        :statuscode: 409: error occurred
    """
    motors = ['Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'] 
    #'Kappa', 'Kappa_phi',
    data = {}
    data['Motors'] = {}
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
                data['Motors'].update({mot: {'Status': status, 'position': pos}})
        data['Camera'] = {'pixelsPerMm': mxcube.diffractometer.get_pixels_per_mm(),
            'imageWidth':  mxcube.diffractometer.image_width,
            'imageHeight':  mxcube.diffractometer.image_height,
            }

        try:
            data['useSC'] = mxcube.diffractometer.use_sc  
        except AttributeError:
            data['useSC'] = False # in case the diff does not have this implemented
            
        beamInfo = mxcube.beamline.getObjectByRole("beam_info")
        data['beamInfo'] = {}
        if beamInfo is None:
             logging.getLogger('HWR').error("beamInfo is not defined")
        try:
            beamInfoDict = beamInfo.get_beam_info()
        except Exception:
            pass

        data['beamInfo'] = {}

        try:
            aperture = mxcube.diffractometer.getObjectByRole('aperture')
            aperture_list = aperture.getPredefinedPositionsList()
            currentAperture = aperture.getCurrentPositionName()
        except Exception:
            logging.getLogger('HWR').exception('could not get all Aperture hwobj')
            aperture_list = []
            currentAperture = None
 
        data['beamInfo'].update({'apertureList' : aperture_list,
                                'currentAperture' : currentAperture })
        
        try:
            data['beamInfo'].update({'position': beamInfo.get_beam_position(),
                                'shape': beamInfoDict["shape"],
                                'size_x': beamInfoDict["size_x"],
                                'size_y': beamInfoDict["size_y"],
                                'apertureList' : aperture.getPredefinedPositionsList(),
                                'currentAperture' : aperture.getCurrentPositionName()
                                })
        except Exception:
             logging.getLogger('HWR').error("Error retrieving beam position")

        try:
            data['current_phase'] = mxcube.diffractometer.current_phase
        except AttributeError:
            data['current_phase'] =  'None' # in case the diff does not have this implemented

        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could not get all motor  status')
        return Response(status=409)

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
