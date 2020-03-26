# -*- coding: utf-8 -*-
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os
import logging
import sys

from mxcube3 import blcontrol
from mxcube3 import mxcube

from .qutils import READY


from mxcube3.core.beamline_adapter import BeamlineAdapter


def init_signals():
    from mxcube3.routes import signals

    try:
        beamInfo = blcontrol.beamline.beam
        if beamInfo is not None:
            for sig in signals.beam_signals:
                beamInfo.connect(beamInfo, sig, signals.beam_changed)
        else:
            logging.getLogger("MX3.HWR").error("beam_info is not defined")
    except Exception as ex:
        msg = "error connecting to beamline_adapter/beam_info hardware object "
        msg += "signals"
        logging.getLogger("MX3.HWR").exception(msg)
    try:
        actions = blcontrol.actions
        if actions is not None:
            cmds = actions.getCommands()
            for cmd in cmds:
                cmd.connectSignal(
                    "commandBeginWaitReply", signals.beamline_action_start
                )
                cmd.connectSignal("commandReplyArrived", signals.beamline_action_done)
                cmd.connectSignal("commandFailed", signals.beamline_action_failed)
        else:
            logging.getLogger("MX3.HWR").error(
                "beamline_actions hardware object is not defined"
            )
    except Exception as ex:
        msg = "error connecting to beamline actions hardware object signals"
        logging.getLogger("MX3.HWR").exception(msg)

    try:
        safety_shutter = blcontrol.beamline.safety_shutter
        if safety_shutter is not None:
            safety_shutter.connect(
                safety_shutter,
                "shutterStateChanged",
                signals.safety_shutter_state_changed,
            )
        else:
            logging.getLogger("MX3.HWR").error("safety_shutter is not defined")
    except Exception as ex:
        logging.getLogger("MX3.HWR").error(
            "error loading safety_shutter hwo: %s" % str(ex)
        )

    try:
        blcontrol.plotting.connect(blcontrol.plotting, "new_plot", signals.new_plot)
        blcontrol.plotting.connect(blcontrol.plotting, "plot_data", signals.plot_data)
        blcontrol.plotting.connect(blcontrol.plotting, "plot_end", signals.plot_end)
    except Exception as ex:
        logging.getLogger("MX3.HWR").error("error loading plotting hwo: %s" % str(ex))

    try:
        blcontrol.beamline.xrf_spectrum.connect(
            blcontrol.beamline.xrf_spectrum, "new_plot", signals.new_plot
        )
        blcontrol.beamline.xrf_spectrum.connect(
            blcontrol.beamline.xrf_spectrum, "plot_data", signals.plot_data
        )
        blcontrol.beamline.xrf_spectrum.connect(
            blcontrol.beamline.xrf_spectrum, "plot_end", signals.plot_end
        )
        blcontrol.beamline.xrf_spectrum.connect(
            blcontrol.beamline.xrf_spectrum,
            "xrf_task_progress",
            signals.xrf_task_progress,
        )
    except Exception as ex:
        logging.getLogger("MX3.HWR").error("error loading plotting hwo: %s" % str(ex))


def diffractometer_init_signals():
    """
    Connect all the relevant hwobj signals with the corresponding
    callback method.
    """
    from mxcube3.routes import signals

    diffractometer = blcontrol.beamline.diffractometer
    diffractometer.connect("phaseChanged", signals.diffractometer_phase_changed)


def get_aperture():
    """
    Returns list of apertures and the one currently used.

    :return: Tuple, (list of apertures, current aperture)
    :rtype: tuple
    """
    aperture_list, current_aperture = [], None
    beam = blcontrol.beamline.beam

    aperture_list = beam.get_available_size()["values"]
    current_aperture = beam.get_value()[-1]

    return aperture_list, current_aperture


def get_beam_definer():
    beam_info = blcontrol.beamline.beam

    if hasattr(beam_info, "beam_definer") and beam_info.beam_definer:
        bd = beam_info.beam_definer
    else:
        bd = beam_info.getObjectByRole("aperture")

    return bd


def get_viewport_info():
    """
    Get information about current "view port" video dimension, beam position,
    pixels per mm, returns a dictionary with the format:

        data = {"pixelsPerMm": pixelsPerMm,
                "imageWidth": width,
                "imageHeight": height,
                "format": fmt,
                "sourceIsScalable": source_is_scalable,
                "scale": scale,
                "videoSizes": video_sizes,
                "position": position,
                "shape": shape,
                "size_x": sx, "size_y": sy}

    :returns: Dictionary with view port data, with format described above
    :rtype: dict
    """
    fmt, source_is_scalable = "MJPEG", False

    if mxcube.VIDEO_DEVICE and os.path.exists(mxcube.VIDEO_DEVICE):
        fmt, source_is_scalable = "MPEG1", True
        video_sizes = blcontrol.beamline.sample_view.camera.get_available_stream_sizes()
        width, height, scale = blcontrol.beamline.sample_view.camera.get_stream_size()
    else:
        video_sizes = [blcontrol.beamline.sample_view.camera.getWidth(),
                       blcontrol.beamline.sample_view.camera.getHeight()]
        width, height, scale = video_sizes + [1]
    
    pixelsPerMm = blcontrol.beamline.diffractometer.get_pixels_per_mm()

    beam_info_dict = get_beam_info()

    data = {
        "pixelsPerMm": pixelsPerMm,
        "imageWidth": width,
        "imageHeight": height,
        "format": fmt,
        "sourceIsScalable": source_is_scalable,
        "scale": scale,
        "videoSizes": video_sizes,
        "videoHash": blcontrol.beamline.sample_view.camera.stream_hash,
    }

    data.update(beam_info_dict)
    return data


def beamline_get_all_attributes():
    ho = BeamlineAdapter(blcontrol.beamline)
    data = ho.dict_repr()
    actions = list()

    try:
        cmds = blcontrol.actions.getCommands()
    except Exception:
        cmds = []
    for cmd in cmds:
        args = []
        for arg in cmd.getArguments():
            argname = arg[0]
            argtype = arg[1]
            args.append({"name": argname, "type": argtype})
            if argtype == "combo":
                args[-1]["items"] = cmd.getComboArgumentItems(argname)

        actions.append(
            {
                "name": cmd.name(),
                "username": cmd.userName(),
                "state": READY,
                "arguments": args,
                "messages": [],
                "type": cmd.type,
                "data": cmd.value(),
            }
        )

    data.update({"availableMethods": ho.get_available_methods()})

    data.update(
        {
            "path": blcontrol.beamline.session.get_base_image_directory(),
            "actionsList": actions,
        }
    )

    data.update({"energyScanElements": ho.get_available_elements().get("elements", [])})

    return data


def beamline_abort_action(name):
    """
    Aborts an action in progress.

    :param str name: Owner / Actuator of the process/action to abort

    """
    try:
        cmds = blcontrol.actions.getCommands()
    except Exception:
        cmds = []

    for cmd in cmds:
        if cmd.name() == name:
            cmd.abort()

    ho = BeamlineAdapter(blcontrol.beamline).get_object(name.lower())
    ho.stop()


def beamline_run_action(name, params):
    """
    Starts beamline action with name <name> and passes params as arguments

    : param str name: action to run
    """
    try:
        cmds = blcontrol.actions.getCommands()
    except Exception:
        cmds = []

    for cmd in cmds:
        if cmd.name() == name:
            try:
                cmd.emit("commandBeginWaitReply", name)
                logging.getLogger("user_level_log").info(
                    "Starting %s(%s)", cmd.userName(), ", ".join(map(str, params))
                )
                cmd(*params)
            except Exception:
                err = str(sys.exc_info()[1])
                raise Exception(str(err))

    else:
        msg = "Action cannot run: command '%s' does not exist" % name
        raise Exception(msg)


def beamline_set_attribute(name, data):
    """
    """
    if name.lower() == "detdist":
        ho = BeamlineAdapter(blcontrol.beamline).get_object("dtox")
    else:
        ho = BeamlineAdapter(blcontrol.beamline).get_object(name.lower())

    try:
        ho.set(data["value"])
        data = ho.dict_repr()
        res = True
    except Exception as ex:
        data = ho.dict_repr()
        data["value"] = ho.get()
        data["state"] = "UNUSABLE"
        data["msg"] = "submitted value out of limits"
        res = False
        logging.getLogger("MX3.HWR").error("Error setting bl attribute: " + str(ex))

    return res, data


def beamline_get_attribute(name):
    """
    """
    ho = BeamlineAdapter(blcontrol.beamline).getObjectByRole(name.lower())
    data = {"name": name, "value": ""}

    try:
        data = ho.dict_repr()
        res = 200
    except Exception as ex:
        data["value"] = ""
        data["state"] = "UNUSABLE"
        data["msg"] = str(ex)
        res = 520

    return res, data


def get_beam_info():
    """
    Returns beam information retrieved by the beam_info hardware object,
    containing position, size and shape.

    :return: Beam info dictionary with keys: position, shape, size_x, size_y
    :rtype: dict
    """
    beam_info = blcontrol.beamline.beam
    beam_info_dict = {"position": [], "shape": "", "size_x": 0, "size_y": 0}
    if beam_info is not None:
        _beam = beam_info.get_value()
        beam_info_dict.update(
            {
                "position": beam_info.get_beam_position(),
                "size_x": _beam[0],
                "size_y": _beam[1],
                "shape": _beam[2].value,
            }
        )

    aperture_list, current_aperture = get_aperture()

    beam_info_dict.update(
        {"apertureList": aperture_list, "currentAperture": current_aperture}
    )

    return beam_info_dict


def prepare_beamline_for_sample():
    if hasattr(blcontrol.beamline.collect, "prepare_for_new_sample"):
        blcontrol.beamline.collect.prepare_for_new_sample()


def diffractometer_set_phase(phase):
    try:
        blcontrol.beamline.diffractometer.wait_device_ready(30)
    except Exception:
        logging.getLogger("MX3.HWR").warning("Diffractometer not ready")

    blcontrol.beamline.diffractometer.set_phase(phase)


def set_aperture(pos):
    beam = blcontrol.beamline.beam
    msg = "Changing aperture diameter to: %s" % pos
    logging.getLogger("MX3.HWR").info(msg)
    beam.set_value(float(pos))


def diffractometer_get_info():
    ret = {}

    try:
        ret["useSC"] = blcontrol.beamline.diffractometer.use_sc
    except AttributeError:
        ret["useSC"] = False

    try:
        ret["currentPhase"] = blcontrol.beamline.diffractometer.current_phase
    except AttributeError:
        ret["currentPhase"] = "None"

    try:
        ret["phaseList"] = blcontrol.beamline.diffractometer.get_phase_list()
    except AttributeError:
        ret["phaseList"] = []

    return ret


def get_detector_info():
    filetype = blcontrol.beamline.detector.getProperty("file_suffix")

    if filetype is None:
        filetype = "cbf"
        logging.getLogger("MX3.HWR").warning(
            "Detector file format not specified. Setting as cbf."
        )

    return filetype
