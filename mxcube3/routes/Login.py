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

    :returns: Response Object, Content-Type: application/json, an object
    containing following info:

       {'status':{ 'code': 'ok', 'msg': msg },
        'Proposal': proposal,
        'session': todays_session,
        'local_contact': local_contact,
        'person': someone,
        'laboratory': a_laboratory]}

    Status code set to:
       200: On success
       409: Error, could not log in
    """
    global LOGGED_IN_USER
    global MASTER

    content = request.get_json()
    loginID = content['proposal']
    password = content['password']

    if LOGGED_IN_USER is not None and LOGGED_IN_USER != loginID:
        data = {"code": "", "msg": "Another user is already logged in" }
        return make_response(data, 409)

    login_res = limsutils.lims_login(loginID, password)

    if login_res['status']['code'] == 'ok':
        session['loginInfo'] = {'loginID': loginID,
                                'password': password,
                                'loginRes': login_res}

        LOGGED_IN_USER = loginID

        if not MASTER:
            MASTER = session.sid

    return make_response(login_res['status']['code'], 200)


@mxcube.route("/mxcube/api/v0.1/signout")
def signout():
    """
    Signout from Mxcube3 and reset the session
    """
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

    :returns: Response Object, Content-Type: application/json, an object
              containing:

      {'synchrotron_name': synchrotron_name,
       'beamline_name': beamline_name,
       'loginType': loginType,
       'loginRes': {'status':{ 'code': 'ok', 'msg': msg },
       'Proposal': proposal, 'session': todays_session,
       'local_contact': local_contact,
       'person': someone,
       'laboratory': a_laboratory']}}

    Status code set to:
       200: On success
       409: Error, could not log in
    """
    global LOGGED_IN_USER
    global MASTER

    login_info = session.get("loginInfo")

    if login_info is not None:
        loginID = login_info["loginID"]

        if LOGGED_IN_USER is not None and LOGGED_IN_USER != loginID:
            return make_response("", 409)

        LOGGED_IN_USER = loginID

        if not MASTER:
            MASTER = session.sid

        session['loginInfo'] = login_info

    mxcube.queue = qutils.get_queue(session)
    logging.getLogger('HWR').info('Loaded queue')
    logging.getLogger('HWR').info('[QUEUE] %s ' % qutils.queue_to_json())

    login_info = login_info["loginRes"] if login_info is not None else {}
    login_info = limsutils.convert_to_dict(login_info)

    return jsonify(
        { "synchrotron_name": mxcube.session.synchrotron_name,
          "beamline_name": mxcube.session.beamline_name,
          "loginType": mxcube.db_connection.loginType.title(),
          "loginRes": login_info,
          "queue": qutils.queue_to_dict(),
          "master": MASTER == session.sid })
