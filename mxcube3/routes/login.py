from flask import session, request, jsonify, make_response, redirect

from mxcube3 import server
from mxcube3.core import loginutils


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

    res = loginutils.login(login_id, password)

    import pdb
    pdb.set_trace()

    return jsonify(res)


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
