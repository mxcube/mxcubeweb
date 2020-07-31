import logging

from flask import session, request, jsonify, make_response, redirect

from mxcube3 import server
from mxcube3 import socketio
from mxcube3.core import loginutils


def deny_access(msg):
    resp = jsonify({"msg": msg})
    resp.code = 409
    return resp


@server.route("/mxcube/api/v0.1/login", methods=["POST"])
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

    params = request.get_json()
    login_id = params.get("proposal", "")
    password = params.get("password", "")

    try:
        res = jsonify(loginutils.login(login_id, password))
    except Exception as ex:
        msg = "[LOGIN] User %s could not login (%s)" % (login_id, str(ex))
        logging.getLogger("MX3.HWR").info(msg)
        res = deny_access(str(ex))

    return res


@server.route("/mxcube/api/v0.1/signout")
@server.restrict
def signout():
    """
    Signout from Mxcube3 and reset the session
    """
    loginutils.signout()

    return make_response("", 200)


@server.route("/mxcube/api/v0.1/login_info", methods=["GET"])
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
    login_info = session.get("loginInfo")

    user, res = loginutils.login_info(login_info)

    # Redirect the user to login page if for some reason logged out
    # i.e. server restart
    if not user:
        response = redirect("/login", code=302)
    else:
        response = jsonify(res)

    return response


@server.route("/mxcube/api/v0.1/send_feedback", methods=["POST"])
@server.restrict
def send_feedback():
    loginutils.send_feedback()
    return make_response("", 200)


@socketio.on("connect", namespace="/network")
def network_ws_connect():
    msg = "Client with sid %s connected" % str(request.sid)
    logging.getLogger("MX3.HWR").info(msg)


@socketio.on("disconnect", namespace="/network")
def network_ws_disconnect():
    msg = "Client with sid %s disconnected" % str(request.sid)
    logging.getLogger("MX3.HWR").info(msg)

