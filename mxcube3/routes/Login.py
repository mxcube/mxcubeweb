import logging
import os
import Utils

from flask import session, request, jsonify, make_response, Response
from mxcube3 import app as mxcube
from mxcube3 import state_storage
from mxcube3.routes import qutils
from mxcube3.routes import limsutils
from mxcube3 import socketio


from loginutils import (create_user, add_user, remove_user, get_user_by_sid,
                        logged_in_users, deny_access, users, set_operator,
                        get_operator, is_operator, get_observer_name,
                        is_local_host, remote_addr, get_observers)


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
    params = request.get_json()
    loginID = params.get("proposal", "")
    password = params.get("password", "")

    try:
        login_res = limsutils.lims_login(loginID, password)
        inhouse = limsutils.lims_is_inhouse(login_res)

        info = {"valid": limsutils.lims_valid_login(login_res),
                "local": is_local_host(),
                "existing_session": limsutils.lims_existing_session(login_res),
                "inhouse": inhouse}

        _users = logged_in_users(exclude_inhouse=True)

        # Only allow in-house log-in from local host
        if inhouse and not (inhouse and is_local_host()):
            return deny_access("In-house only allowed from localhost")

        # Only allow other users to log-in if they are from the same proposal
        if (not inhouse) and _users and (loginID not in _users):
            return deny_access("Another user is already logged in")

        # Only allow local login when remote is disabled
        if not mxcube.ALLOW_REMOTE and not is_local_host():
            return deny_access("Remote access disabled")

        # Only allow remote logins with existing sessions
        if limsutils.lims_valid_login(login_res) and is_local_host():
            msg = "[LOGIN] Valid login from local host (%s)" % str(info)
            logging.getLogger("HWR").info(msg)
        elif limsutils.lims_valid_login(login_res) and \
             limsutils.lims_existing_session(login_res):
            msg = "[LOGIN] Valid remote login from %s with existing session (%s)"
            msg += msg % (remote_addr(), str(info))
            logging.getLogger("HWR").info(msg)
        else:
            logging.getLogger("HWR").info("Invalid login %s" % info)
            return deny_access(str(info))
    except:
        return deny_access("")
    else:
        add_user(create_user(loginID, remote_addr(), session.sid, login_res))

        session['loginInfo'] = {'loginID': loginID,
                                'password': password,
                                'loginRes': login_res}

        # Create a new queue just in case any previous queue was not cleared
        # properly
        mxcube.queue = qutils.new_queue()

        # For the moment not loading queue from persistent storage (redis),
        # uncomment to enable loading.
        # qutils.load_queue(session)
        # logging.getLogger('HWR').info('Loaded queue')
        logging.getLogger('HWR').info('[QUEUE] %s ' % qutils.queue_to_json())

        if not get_operator():
            set_operator(session.sid)

        return jsonify(login_res['status'])


@mxcube.route("/mxcube/api/v0.1/signout")
@mxcube.restrict
def signout():
    """
    Signout from Mxcube3 and reset the session
    """
    qutils.save_queue(session)
    mxcube.queue = qutils.new_queue()
    mxcube.shapes.clear_all()
    qutils.init_queue_settings()
    if hasattr(mxcube.session, 'clear_session'):
        mxcube.session.clear_session()

    if mxcube.CURRENTLY_MOUNTED_SAMPLE:
        if mxcube.CURRENTLY_MOUNTED_SAMPLE.get('location', '') == 'Manual':
            mxcube.CURRENTLY_MOUNTED_SAMPLE = ''

    user = remove_user(session.sid)
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
    login_info = session.get("loginInfo")

    login_info = login_info["loginRes"] if login_info is not None else {}
    login_info = limsutils.convert_to_dict(login_info)

    res = {"synchrotron_name": mxcube.session.synchrotron_name,
           "beamline_name": mxcube.session.beamline_name,
           "loginType": mxcube.db_connection.loginType.title(),
           "loginRes": login_info,
           "master": is_operator(session.sid),
           "observerName": get_observer_name()
           }

    user = get_user_by_sid(session.sid)

    if user:
        res["selectedProposal"] = user["loginID"]
    else:
        res["selectedProposal"] = {}


    return jsonify(res)


@mxcube.route("/mxcube/api/v0.1/send_feedback", methods=["POST"])
@mxcube.restrict
def send_feedback():

    sender_data = request.get_json()
    sender_data["LOGGED_IN_USER"] = get_user_by_sid(session.sid)["loginID"]

    Utils.send_feedback(sender_data)

    return make_response("", 200)
