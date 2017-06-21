import sys
import json
import logging
import signals
from flask import Response, jsonify, request, make_response
from qutils import READY, RUNNING

from mxcube3 import app as mxcube

from mxcube3.ho_mediators.beamline_setup import BeamlineSetupMediator
from mxcube3.routes import beamlineutils

def init_signals():
    try:
        beamInfo = mxcube.beamline.getObjectByRole("beam_info")
        if beamInfo is not None:
            for sig in signals.beam_signals:
                beamInfo.connect(beamInfo, sig, signals.beam_changed)
        else:
            logging.getLogger('HWR').error("beam_info is not defined")
    except Exception, ex:
        logging.getLogger('HWR').\
            exception("error connecting to beamline_setup/beam_info hardware object signals")
    try:
        actions = mxcube.actions
        if actions is not None:
            cmds = actions.getCommands()
            for cmd in cmds:
                cmd.connectSignal("commandBeginWaitReply", signals.beamline_action_start)
                cmd.connectSignal("commandReplyArrived", signals.beamline_action_done)
                cmd.connectSignal("commandFailed", signals.beamline_action_failed)
        else:
            logging.getLogger('HWR').error("beamline_actions hardware object is not defined")
    except Exception, ex:
        logging.getLogger('HWR').\
            exception("error connecting to beamline actions hardware object signals")

    try:
        safety_shutter = mxcube.beamline.getObjectByRole("safety_shutter")
        if safety_shutter is not None:
            safety_shutter.connect(safety_shutter, 'shutterStateChanged',
                           signals.safety_shutter_state_changed)
        else:
            logging.getLogger('HWR').error("safety_shutter is not defined")
    except Exception, ex:
        logging.getLogger('HWR').\
            error("error loading safety_shutter hwo is not defined (%s)" % str(ex))


@mxcube.route("/mxcube/api/v0.1/beamline", methods=['GET'])
def beamline_get_all_attributes():
    ho = BeamlineSetupMediator(mxcube.beamline)
    data = ho.dict_repr()
    actions = list()
    try:
        cmds = mxcube.actions.getCommands()
    except Exception:
        cmds = []
    for cmd in cmds:
        args = []
        for arg in cmd.getArguments():
          argname = arg[0]; argtype = arg[1]
          args.append({ "name": argname, "type": argtype })
          if argtype == 'combo':
            args[-1]["items"] = cmd.getComboArgumentItems(argname)

        actions.append({ "name": cmd.name(), "username": cmd.userName(), "state": READY, "arguments": args, "messages": [] })

    data.update({'path': mxcube.session.get_base_image_directory(), 'actionsList': actions })

    return jsonify(data)


@mxcube.route("/mxcube/api/v0.1/beamline/<name>/abort", methods=['GET'])
def beamline_abort_action(name):
    """
    Aborts an action in progress.

    :param str name: Owner / Actuator of the process/action to abort

    Replies with status code 200 on success and 520 on exceptions.
    """
    try:
        cmds = mxcube.actions.getCommands()
    except Exception:
        cmds = []

    for cmd in cmds:
        if cmd.name() == name:
            try:
                cmd.abort()
            except Exception:
                err = str(sys.exc_info()[1])
                return make_response(err, 520)
            else:
                return make_response("", 200)

    # This could be made to give access to arbitrary method of HO, possible
    # security issues to be discussed.
    if name.lower() == "detdist":
        ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole("dtox")
    else:
        ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())
    ho.stop()

    try:
        ho.stop()
    except Exception:
        err = str(sys.exc_info()[1])
        return make_response(err, 520)
    else:
        logging.getLogger('user_level_log').error('Aborting set on %s.' % name)
        return make_response("", 200)


@mxcube.route("/mxcube/api/v0.1/beamline/<name>/run", methods=['POST'])
def beamline_run_action(name):
    """
    Starts a beamline action ; POST payload is a json-encoded object with 'parameters'
    as a list of parameters

    :param str name: action to run

    Replies with status code 200 on success and 520 on exceptions.
    """
    try:
      params = request.get_json()["parameters"]
    except Exception:
      params = []

    try:
        cmds = mxcube.actions.getCommands()
    except Exception:
        cmds = []

    for cmd in cmds:
        if cmd.name() == name:
            try:
                cmd.emit('commandBeginWaitReply', name)
                logging.getLogger('user_level_log').info('Starting %s(%s)', cmd.userName(), ", ".join(map(str,params)))
                cmd(*params)
            except Exception:
                err = str(sys.exc_info()[1])
                return make_response(err, 520)
            else:
                return make_response("", 200)
    else:
        return make_response("Action cannot run: command '%s` does not exist" % name, 520)


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['PUT'])
def beamline_set_attribute(name):
    """
    Tries to set <name> to value, replies with the following json:

        {name: <name>, value: <value>, msg: <msg>, state: <state>

    Where msg is an arbitrary msg to user, state is the internal state
    of the set operation (for the moment, VALID, ABORTED, ERROR).

    Replies with status code 200 on success and 520 on exceptions.
    """
    data = json.loads(request.data)

    if name.lower() == "detdist":
        ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole("dtox")
    else:
        ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())

    try:
        ho.set(data["value"])
        logging.getLogger('HWR').info("Setting bl attribute %s to %s" %(name, data["value"]))
        res = ho.dict_repr()
        code = 200
    except Exception as ex:
        res = ho.dict_repr()
        res["value"] = ho.get()
        res["state"] = "UNUSABLE"
        res["msg"] = "submitted value out of limits"
        code = 520
        logging.getLogger('HWR').error("Error setting bl attribute: " + str(ex))

    response = jsonify(res)
    response.code = code
    return response


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['GET'])
def beamline_get_attribute(name):
    """
    Retrieves value of attribute <name>, replies with the following json:

        {name: <name>, value: <value>, msg: <msg>, state: <state>

    Where msg is an arbitrary msg to user, state is the internal state
    of the get operation (for the moment, VALID, ABORTED, ERROR).

    Replies with status code 200 on success and 520 on exceptions.
    """
    ho = BeamlineSetupMediator(mxcube.beamline).getObjectByRole(name.lower())
    data = {"name": name, "value": ""}

    try:
        data = ho.dict_repr()
        code = 200
    except Exception as ex:
        data["value"] = ""
        data["state"] = "UNUSABLE"
        data["msg"] = str(ex)
        code = 520

    response = jsonify(data)
    response.code = code
    return response


@mxcube.route("/mxcube/api/v0.1/beam/info", methods=['GET'])
def get_beam_info():
    """
    Beam information: position,size,shape
    return_data={"position":,"shape":,"size_x":,"size_y":}
    """
    beam_info_dict = beamlineutils.get_beam_info()
    aperture_list, current_aperture = beamlineutils.get_aperture()

    ret = {'position': beam_info_dict.get("position"),
           'shape': beam_info_dict.get("shape"),
           'size_x': beam_info_dict.get("size_x"),
           'size_y': beam_info_dict.get("size_y"),
           'apertureList': aperture_list,
           'currentAperture': current_aperture}

    return jsonify(ret)


@mxcube.route("/mxcube/api/v0.1/beamline/datapath", methods=['GET'])
def beamline_get_data_path():
    """
    Retrieve data directory from the session hwobj,
    this is specific for each beamline.
    """
    data = mxcube.session.get_base_image_directory()
    return jsonify(data)
