import logging
import os

from flask import session, request, jsonify, make_response
from mxcube3 import app as mxcube
from mxcube3.routes import qutils
from mxcube3.routes import limsutils
from mxcube3 import remote_access, state_storage
from mxcube3 import socketio
from scandir import scandir

LOGGED_IN_USER = None


def scantree(path, include):
    res = []

    try:
        res = _scantree_rec(path, include, [])
    except OSError as ex:
        pass

    return res


def _scantree_rec(path, include=[], files=[]):
    for entry in scandir(path):
        if entry.is_dir(follow_symlinks=False):
            _scantree_rec(entry.path, include, files)
        elif entry.is_file():
            if os.path.splitext(entry.path)[1][1:] in include:
                files.append(entry.path)

    return files


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

    content = request.get_json()
    loginID = content['proposal']
    password = content['password']

    if LOGGED_IN_USER is not None and LOGGED_IN_USER != loginID:
        data = {"code": "", "msg": "Another user is already logged in"}
        resp = jsonify(data)
        resp.code = 409
        return resp

    login_res = limsutils.lims_login(loginID, password)

    if login_res['status']['code'] == 'ok':
        session['loginInfo'] = {'loginID': loginID,
                                'password': password,
                                'loginRes': login_res}

        LOGGED_IN_USER = loginID

        # Create a new queue just in case any previous queue was not cleared
        # properly
        mxcube.queue = qutils.new_queue()

        # For the moment not loading queue from persistent storage (redis),
        # uncomment to enable loading.
        # qutils.load_queue(session)
        # logging.getLogger('HWR').info('Loaded queue')
        logging.getLogger('HWR').info('[QUEUE] %s ' % qutils.queue_to_json())

        if not remote_access.MASTER:
            remote_access.set_master(session.sid)

    return jsonify(login_res['status'])


@mxcube.route("/mxcube/api/v0.1/signout")
def signout():
    """
    Signout from Mxcube3 and reset the session
    """
    global LOGGED_IN_USER

    qutils.save_queue(session)
    mxcube.queue = qutils.new_queue()
    mxcube.shapes.clear_all()

    if mxcube.CURRENTLY_MOUNTED_SAMPLE:
        if mxcube.CURRENTLY_MOUNTED_SAMPLE_DATA['location'] == 'Manual':
            mxcube.CURRENTLY_MOUNTED_SAMPLE = ''

    LOGGED_IN_USER = None
    if remote_access.is_master(session.sid):
        state_storage.flush()
        remote_access.flush()

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
    login_info = session.get("loginInfo")

    if login_info is not None:
        login_id = login_info["loginID"]

        if LOGGED_IN_USER is not None and LOGGED_IN_USER != login_id:
            return make_response("", 409)

        LOGGED_IN_USER = login_id

        if not remote_access.MASTER:
            remote_access.set_master(session.sid)

        session['loginInfo'] = login_info

    login_info = login_info["loginRes"] if login_info is not None else {}
    login_info = limsutils.convert_to_dict(login_info)

    res = {"synchrotron_name": mxcube.session.synchrotron_name,
           "beamline_name": mxcube.session.beamline_name,
           "loginType": mxcube.db_connection.loginType.title(),
           "loginRes": login_info,
           "queue": qutils.queue_to_dict(),
           "master": remote_access.is_master(session.sid),
           "observerName": remote_access.observer_name()
           }

    if res["loginType"].lower() != 'user' and login_info:
        # autoselect proposal
        limsutils.select_proposal(LOGGED_IN_USER)
        res["selectedProposal"] = LOGGED_IN_USER
        logging.getLogger('user_log').info('[LIMS] Proposal autoselected.')


    # Get all the files in the root data dir for this user
    if not mxcube.INITIAL_FILE_LIST:
        ftype = mxcube.beamline.detector_hwobj.getProperty('file_suffix')
        root_path = mxcube.session.get_base_image_directory()
        mxcube.INITIAL_FILE_LIST = scantree(root_path, [ftype])

    return jsonify(res)


@mxcube.route("/mxcube/api/v0.1/login/request_control", methods=["POST"])
def request_control():
    """
    """
    data = request.get_json()

    # Is someone already asking for control
    for observer in remote_access.OBSERVERS.values():
        if observer["requestsControl"]:
            msg = "Another user is already asking for control"
            return make_response(msg, 409)

    remote_addr = remote_access.remote_addr()

    remote_access.OBSERVERS[remote_addr]["name"] = data["name"]
    remote_access.OBSERVERS[remote_addr]["requestsControl"] = True
    remote_access.OBSERVERS[remote_addr]["message"] = data["message"]

    data = remote_access.OBSERVERS.values()

    socketio.emit("observersChanged", data, namespace='/hwr')

    return make_response("", 200)


@mxcube.route("/mxcube/api/v0.1/login/observers", methods=["GET"])
def observers():
    """
    """
    data = {'observers': remote_access.OBSERVERS.values(),
            'sid': session.sid,
            'master': remote_access.is_master(session.sid),
            'observerName': remote_access.observer_name()}

    return jsonify(data=data)


def observer_requesting_control():
    observer = None

    for o in remote_access.OBSERVERS.values():
        if o["requestsControl"]:
            observer = o

    return observer

@mxcube.route("/mxcube/api/v0.1/login/request_control_response", methods=["POST"])
def request_control_response():
    """
    """
    data = request.get_json()
    observer = observer_requesting_control()
    observers = remote_access.OBSERVERS.values()

    # Request was denied
    if not data['giveControl']:
        data["sid"] = session.sid

        # Reset request of observer, since it was denied
        observer["requestsControl"] = False

        socketio.emit("observersChanged", observers, namespace='/hwr')
        socketio.emit("setMaster", data, namespace='/hwr')
    else:
        # Find the user asking for control and remove her from observers
        # and make her master
        observer = remote_access.OBSERVERS.pop(observer["host"])
        remote_access.set_master(observer["sid"])

        data["sid"] = observer["sid"]

        socketio.emit("observersChanged", observers, namespace='/hwr')
        socketio.emit("setMaster", data, namespace='/hwr')

    return make_response("", 200)
