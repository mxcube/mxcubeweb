from flask import session, request, jsonify, make_response
from mxcube3 import app as mxcube
from mxcube3.routes import Queue, Utils
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
    session.clear()
    return make_response("", 200)

@mxcube.route("/mxcube/api/v0.1/login_info", methods=["GET"])
def loginInfo():
    """
    Retrieve session/login info
     :response Content-Type: application/json, {"synchrotron_name": synchrotron_name, "beamline_name": beamline_name,
                    "loginType": loginType, "loginRes": {'status':{ "code": "ok", "msg": msg }, 'Proposal': proposal, 'session': todays_session, "local_contact": local_contact, "person": someone, "laboratory": a_laboratory']} }
    """
    loginInfo = session.get("loginInfo")
 
    if loginInfo is not None:
        loginInfo["loginRes"] = mxcube.db_connection.login(loginInfo["loginID"], loginInfo["password"])
        session['loginInfo'] = loginInfo
  
    mxcube.queue = Utils.get_queue(session) 
 
    return jsonify(
                    { "synchrotron_name": mxcube.session.synchrotron_name,
                      "beamline_name": mxcube.session.beamline_name,
                      "loginType": mxcube.db_connection.loginType.title(),
                      "loginRes": convert_to_dict(loginInfo["loginRes"] if loginInfo is not None else {}),
                      "queue": Queue.serialize_queue_to_json()
                    }
                  )


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
