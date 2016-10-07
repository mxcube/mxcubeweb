import logging

from flask import session, request, jsonify, make_response
from mxcube3 import app as mxcube
from mxcube3.routes import qutils
from mxcube3.routes import limsutils


LOGGED_IN_USER = None
MASTER = None


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
    global LOGGED_IN_USER
    global MASTER

    content = request.get_json()
    loginID = content['proposal']
    if LOGGED_IN_USER is not None and LOGGED_IN_USER != loginID:
        return make_response({ "code": "", "msg": "Another user is already logged in" }, 409)

    password = content['password']
    loginRes = mxcube.db_connection.login(loginID, password)
    mxcube.db_connection.get_todays_session(loginRes)
    mxcube.rest_lims.authenticate(loginID, password)
   
    if loginRes['status']['code'] == 'ok':
        session['loginInfo'] = { 'loginID': loginID, 'password': password, 'loginRes': loginRes }
        LOGGED_IN_USER = loginID
        if not MASTER:
            MASTER = session.sid
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
    #if MASTER == session['user_id']
    global MASTER
    global LOGGED_IN_USER

    LOGGED_IN_USER = None
    if session.sid == MASTER:
        MASTER = None
    session.clear()
    return make_response("", 200)


@mxcube.route("/mxcube/api/v0.1/login_info", methods=["GET"])
def loginInfo():
    """
    Retrieve session/login info
     :response Content-Type: application/json, {"synchrotron_name": synchrotron_name, "beamline_name": beamline_name,
                    "loginType": loginType, "loginRes": {'status':{ "code": "ok", "msg": msg }, 'Proposal': proposal, 'session': todays_session, "local_contact": local_contact, "person": someone, "laboratory": a_laboratory']} }
    """     
    global LOGGED_IN_USER
    global MASTER
    loginInfo = session.get("loginInfo")

    if loginInfo is not None:
        loginID = loginInfo["loginID"]
        if LOGGED_IN_USER is not None and LOGGED_IN_USER != loginID:
            return make_response("", 409)

        # auto log in
        loginInfo["loginRes"] = mxcube.db_connection.login(loginID, loginInfo["password"])
        LOGGED_IN_USER = loginID
        if not MASTER:
            MASTER = session.sid
        session['loginInfo'] = loginInfo
  
    mxcube.queue = qutils.get_queue(session)
    logging.getLogger('HWR').info('Loaded queue')
    logging.getLogger('HWR').info('[QUEUE] %s ' % qutils.queue_to_json())
 
    return jsonify(
                    { "synchrotron_name": mxcube.session.synchrotron_name,
                      "beamline_name": mxcube.session.beamline_name,
                      "loginType": mxcube.db_connection.loginType.title(),
                      "loginRes": limsutils.convert_to_dict(loginInfo["loginRes"] if loginInfo is not None else {}),
                      "queue": qutils.queue_to_dict(),
                      "master": MASTER == session.sid
                    }
                  )
