import logging
from datetime import timedelta

from flask import Blueprint, request, jsonify, make_response, redirect, session
from mxcube3.core.util import networkutils
from flask_login import current_user


def deny_access(msg):
    resp = jsonify({"msg": msg})
    resp.code = 409
    return resp


def init_route(app, server, url_prefix):
    bp = Blueprint("login", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["POST"])
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
            res = jsonify(app.usermanager.login(login_id, password))
        except Exception as ex:
            msg = "[LOGIN] User %s could not login (%s)" % (login_id, str(ex))
            logging.getLogger("MX3.HWR").exception("")
            logging.getLogger("MX3.HWR").info(msg)
            res = deny_access("Could not authenticate")

        session.permanent = True

        return res

    @bp.route("/signout")
    @server.restrict
    def signout():
        """
        Signout from Mxcube3 and reset the session
        """
        app.usermanager.signout()

        return redirect("/login", code=302)

    @bp.route("/login_info", methods=["GET"])
    def login_info():
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
        user, res = app.usermanager.login_info()

        # Redirect the user to login page if for some reason logged out
        # i.e. server restart
        if not user:
            response = redirect("/login", code=302)
        else:
            response = jsonify(res)

        return response

    @bp.route("/send_feedback", methods=["POST"])
    @server.restrict
    def send_feedback():
        sender_data = request.get_json()
        sender_data["LOGGED_IN_USER"] = current_user.nickname
        networkutils.send_feedback(sender_data)
        return make_response("", 200)

    @bp.route("/refresh_session", methods=["GET"])
    @server.restrict
    def refresh_session():
        logging.getLogger("MX3.HWR").debug("Session refresh")
        server.flask.permanent_session_lifetime = timedelta(minutes=1)
        app.usermanager.update_active_users()
        return make_response("", 200)
    return bp
