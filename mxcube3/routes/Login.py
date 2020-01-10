import logging
import os
import Utils
import socket

from flask import session, request, jsonify, make_response, Response, redirect
from mxcube3 import app as mxcube
from mxcube3 import state_storage
from mxcube3.routes import qutils
from mxcube3.routes import limsutils
from mxcube3.routes import scutils
from mxcube3 import socketio


from loginutils import (create_user, add_user, remove_user, get_user_by_sid,
                        logged_in_users, deny_access, users, set_operator,
                        get_operator, is_operator, get_observer_name,
                        is_local_host, remote_addr, get_observers, get_users,
                        get_user_by_name, define_user_type, clear_messages)


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

        if login_res['status']["code"] is not "ok":
            return deny_access("Could not authenticate")

        inhouse = limsutils.lims_is_inhouse(login_res)
        info = {"valid": limsutils.lims_valid_login(login_res),
                "local": is_local_host(),
                "existing_session": limsutils.lims_existing_session(login_res),
                "inhouse": inhouse}

        _users = logged_in_users(exclude_inhouse=False)

        common_proposal = False
        if mxcube.SELECTED_PROPOSAL is not None:
            for prop in login_res['proposalList']:
                _p = prop['Proposal']['code'] + prop['Proposal']['number']
                if _p == mxcube.SELECTED_PROPOSAL:
                    common_proposal = True

        if (loginID in _users):
            return deny_access("Login rejected, you are already logged in")

        # Only allow in-house log-in from local host
        if inhouse and not (inhouse and is_local_host()):
            return deny_access("In-house only allowed from localhost")

        is_staff = limsutils.lims_is_staff(loginID)
        # Only allow other users to log-in if they are from the same proposal
        # or if they are staff
        if not is_staff and not common_proposal and _users and (loginID not in _users):
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
    except Exception as ex:
        logging.getLogger("HWR").error('Login error %s' %ex)
        return deny_access("Could not authenticate")
    else:
        if not logged_in_users(exclude_inhouse=False):
            # Create a new queue just in case any previous queue was not cleared
            # properly but only if there is not any user logged in
            mxcube.queue = qutils.new_queue()
            sample = mxcube.sample_changer.getLoadedSample()
            # If A sample is mounted, get sample changer contents and add mounted
            # sample to the queue
            if sample:
                scutils.get_sample_list()

        user_type = define_user_type(info['local'], is_staff, common_proposal)
        add_user(create_user(loginID, remote_addr(), session.sid, user_type, login_res))
        socketio.emit("usersChanged", get_users(), namespace='/hwr')

        session['loginInfo'] = {'loginID': loginID,
                                'password': password,
                                'loginRes': login_res}

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
    if mxcube.CURRENTLY_MOUNTED_SAMPLE:
        if mxcube.CURRENTLY_MOUNTED_SAMPLE.get('location', '') == 'Manual':
            mxcube.CURRENTLY_MOUNTED_SAMPLE = ''

    user = remove_user(session.sid)

    if not logged_in_users(exclude_inhouse=False):
        qutils.save_queue(session)
        mxcube.queue = qutils.new_queue()
        mxcube.shapes.clear_all()
        qutils.init_queue_settings()
        mxcube.SELECTED_PROPOSAL = None
        mxcube.SELECTED_PROPOSAL_ID = None
        clear_messages()
        # ony clear hwobj if this was the last user
        if hasattr(mxcube.session, 'clear_session'):
            mxcube.session.clear_session()
    session.clear()

    logging.getLogger('HWR').info('[Login] %s user signout' % user['loginID'])

    return make_response("", 200)

@mxcube.route("/mxcube/api/v0.1/forcesignout")
def forcesignout():
    """
    Force signout from Mxcube3 and reset the session
    """
    global LOGGED_IN_USER

    qutils.save_queue(session)
    mxcube.queue = qutils.new_queue()
    mxcube.shapes.clear_all()
    mxcube.session.clear_session()

    if mxcube.CURRENTLY_MOUNTED_SAMPLE:
        if mxcube.CURRENTLY_MOUNTED_SAMPLE.get('location', '') == 'Manual':
            mxcube.CURRENTLY_MOUNTED_SAMPLE = ''

    LOGGED_IN_USER = None
    state_storage.flush()

    mxcube.SELECTED_PROPOSAL = None
    mxcube.SELECTED_PROPOSAL_ID = None

    session.clear()
    socketio.emit("signout", {}, namespace='/hwr')
    return make_response("", 200)

@mxcube.route("/mxcube/api/v0.1/forceusersignout", methods=["POST"])
def forceusersignout():
    """
    Force signout of a given user from Mxcube3
    """
    logging.getLogger("HWR").info('Forcing signout of user')
    user_id = request.get_json()['sid']
    user = get_user_by_sid(user_id)
    # try by name
    if user is None:
        user = get_user_by_name(user_id)
    remove_user(user.get('sid'))
    socketio.emit("signout", user, room=user["socketio_sid"], namespace='/hwr')
    logging.getLogger('HWR').info('[Login] %s user forced signout' % user['loginID'])

    users = get_users()
    
    if len(users) == 0:
        # no one else is connected
        # we are here because the user force logut itself
        mxcube.queue = qutils.new_queue()
        mxcube.shapes.clear_all()
        mxcube.session.clear_session()

        if mxcube.CURRENTLY_MOUNTED_SAMPLE:
            if mxcube.CURRENTLY_MOUNTED_SAMPLE.get('location', '') == 'Manual':
                mxcube.CURRENTLY_MOUNTED_SAMPLE = ''

        LOGGED_IN_USER = None
        mxcube.SELECTED_PROPOSAL = None
        mxcube.SELECTED_PROPOSAL_ID = None
        state_storage.flush()

        session.clear()

    if len(users) == 1 and users[0]['type'] == 'staff':
        # if the only remaining user is staff clean all
        # we are here because a staff user kicked out a normal user
        staff_id = users[0]['sid']
        remove_user(staff_id)
        mxcube.queue = qutils.new_queue()
        mxcube.shapes.clear_all()
        mxcube.session.clear_session()

        if mxcube.CURRENTLY_MOUNTED_SAMPLE:
            if mxcube.CURRENTLY_MOUNTED_SAMPLE.get('location', '') == 'Manual':
                mxcube.CURRENTLY_MOUNTED_SAMPLE = ''

        LOGGED_IN_USER = None
        mxcube.SELECTED_PROPOSAL = None
        mxcube.SELECTED_PROPOSAL_ID = None
        state_storage.flush()

        session.clear()
        socketio.emit("signout", {}, namespace='/hwr')
    
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
    proposal_info = session.get("proposal")
    loginID = login_info["loginID"] if login_info is not None else None
    login_info = login_info["loginRes"] if login_info is not None else {}
    login_info = limsutils.convert_to_dict(login_info)

    res = {"synchrotron_name": mxcube.session.synchrotron_name,
           "beamline_name": mxcube.session.beamline_name,
           "loginType": mxcube.db_connection.loginType.title(),
           "loginID": loginID,
           "host": socket.gethostbyaddr(remote_addr())[0],
           "loginRes": login_info,
           "master": is_operator(session.sid),
           "observerName": get_observer_name()
           }

    user = get_user_by_sid(session.sid)

    if mxcube.SELECTED_PROPOSAL is not None:
        res["selectedProposal"] = mxcube.SELECTED_PROPOSAL
        res["selectedProposalID"] = mxcube.SELECTED_PROPOSAL_ID
    else:
        res["selectedProposal"] = None
        res["selectedProposalID"] = None
    
    # Get all the files in the root data dir for this user
    root_path = mxcube.session.get_base_image_directory()
    
    if not mxcube.INITIAL_FILE_LIST and os.path.isdir(root_path):
        ftype = mxcube.beamline.detector_hwobj.getProperty('file_suffix')

        mxcube.INITIAL_FILE_LIST = scantree(root_path, [ftype])

    # Redirect the user to login page if for some reason logged out
    # i.e. server restart
    if not user:
        response = redirect("/login", code=302)
    else:
        response = jsonify(res)

    return response

@mxcube.route("/mxcube/api/v0.1/send_feedback", methods=["POST"])
@mxcube.restrict
def send_feedback():

    sender_data = request.get_json()
    sender_data["LOGGED_IN_USER"] = get_user_by_sid(session.sid)["loginID"]

    Utils.send_feedback(sender_data)

    return make_response("", 200)

