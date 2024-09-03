# -*- coding: utf-8 -*-
import logging

from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.adapter.beamline_adapter import BeamlineAdapter
from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.components.queue import READY


class Beamline(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def init_signals(self):
        from mxcubeweb.routes import signals

        try:
            beamInfo = HWR.beamline.beam
            if beamInfo is not None:
                for sig in signals.beam_signals:
                    beamInfo.connect(beamInfo, sig, signals.beam_changed)
            else:
                logging.getLogger("MX3.HWR").error("beam_info is not defined")
        except Exception:
            msg = "error connecting to beamline_adapter/beam_info hardware object "
            msg += "signals"
            logging.getLogger("MX3.HWR").exception(msg)
        try:
            actions = HWR.beamline.beamline_actions
            if actions is not None:
                cmds = (
                    HWR.beamline.beamline_actions.get_commands()
                    + HWR.beamline.beamline_actions.get_annotated_commands()
                )
                for cmd in cmds:
                    cmd.connect(
                        "commandBeginWaitReply",
                        signals.beamline_action_start,
                    )
                    cmd.connect(
                        "commandReplyArrived",
                        signals.beamline_action_done,
                    )
                    cmd.connect(
                        "commandFailed",
                        signals.beamline_action_failed,
                    )
            else:
                logging.getLogger("MX3.HWR").error(
                    "beamline_actions hardware object is not defined"
                )
        except Exception:
            msg = "error connecting to beamline actions hardware object signals"
            logging.getLogger("MX3.HWR").exception(msg)

        if HWR.beamline.xrf_spectrum:
            HWR.beamline.xrf_spectrum.connect(
                HWR.beamline.xrf_spectrum,
                "xrf_task_progress",
                signals.xrf_task_progress,
            )

    def diffractometer_init_signals(self):
        """
        Connect all the relevant hwobj signals with the corresponding
        callback method.
        """
        from mxcubeweb.routes import signals

        diffractometer = HWR.beamline.diffractometer
        diffractometer.connect("phaseChanged", signals.diffractometer_phase_changed)

    def get_aperture(self):
        """
        Returns list of apertures and the one currently used.

        :return: Tuple, (list of apertures, current aperture)
        :rtype: tuple
        """
        beam = HWR.beamline.beam

        aperture_list = beam.get_available_size()["values"]
        current_aperture = beam.get_value()[-1]

        return aperture_list, current_aperture

    def get_viewport_info(self):
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

        if self.app.CONFIG.app.VIDEO_FORMAT == "MPEG1":
            fmt, source_is_scalable = "MPEG1", True
            video_sizes = HWR.beamline.sample_view.camera.get_available_stream_sizes()
            (width, height, scale) = HWR.beamline.sample_view.camera.get_stream_size()
        else:
            scale = 1
            width = HWR.beamline.sample_view.camera.get_width()
            height = HWR.beamline.sample_view.camera.get_height()
            video_sizes = [(width, height)]

        pixelsPerMm = HWR.beamline.diffractometer.get_pixels_per_mm()

        beam_info_dict = self.get_beam_info()

        data = {
            "pixelsPerMm": pixelsPerMm,
            "imageWidth": width,
            "imageHeight": height,
            "format": fmt,
            "sourceIsScalable": source_is_scalable,
            "scale": scale,
            "videoSizes": video_sizes,
            "videoHash": HWR.beamline.sample_view.camera.stream_hash,
            "videoURL": self.app.CONFIG.app.VIDEO_STREAM_URL,
        }

        data.update(beam_info_dict)
        return data

    def beamline_get_all_attributes(self):
        ho = BeamlineAdapter(HWR.beamline)
        data = ho.dict()
        actions = list()

        try:
            cmds = HWR.beamline.beamline_actions.get_commands()
        except Exception:
            cmds = []
        for cmd in cmds:
            args = []
            for arg in cmd.get_arguments():
                argname = arg[0]
                argtype = arg[1]
                args.append({"name": argname, "type": argtype})
                if argtype == "combo":
                    args[-1]["items"] = cmd.get_combo_argument_items(argname)

            actions.append(
                {
                    "name": cmd.name(),
                    "username": cmd.name(),
                    "state": READY,
                    "arguments": args,
                    "argument_type": cmd.argument_type,
                    "messages": [],
                    "type": cmd.type,
                    "data": cmd.value(),
                }
            )

        actions.extend(self.beamline_get_actions())

        data.update({"availableMethods": ho.get_available_methods()})

        data.update(
            {
                "path": HWR.beamline.session.get_base_image_directory(),
                "actionsList": actions,
            }
        )

        data.update(
            {"energyScanElements": ho.get_available_elements().get("elements", [])}
        )

        data.update(self.diffractometer_get_info())

        return data

    def beamline_get_actions(self):
        actions = []
        beamline_actions = HWR.beamline.beamline_actions

        if getattr(beamline_actions, "pydantic_model", None):
            for cmd_name in beamline_actions.exported_attributes.keys():
                cmd_object = beamline_actions.get_annotated_command(cmd_name)

                actions.append(
                    {
                        "name": cmd_name,
                        "username": cmd_object.name(),
                        "state": READY,
                        "arguments": beamline_actions.exported_attributes[cmd_name][
                            "signature"
                        ],
                        "argument_type": "JSONSchema",
                        "schema": beamline_actions.exported_attributes[cmd_name][
                            "schema"
                        ],
                        "messages": [],
                        "type": "JSONSchema",
                        "data": "",
                    }
                )

        return actions

    def beamline_abort_action(self, name):
        """
        Aborts an action in progress.

        :param str name: Owner / Actuator of the process/action to abort

        """
        beamline_action_names = [
            cmd.name() for cmd in HWR.beamline.beamline_actions.get_commands()
        ]

        if name in beamline_action_names:
            HWR.beamline.beamline_actions.abort_command(name)
        else:
            try:
                ho = HWR.beamline.get_hardware_object(name.lower())
            except AttributeError:
                pass
            else:
                ho.stop()

    def beamline_run_action(self, name, params):
        """
        Starts beamline action with name <name> and passes params as arguments

        : param str name: action to run
        """
        try:
            HWR.beamline.beamline_actions.execute_command(name, params)
        except Exception as ex:
            msg = "Action cannot run: command '%s' does not exist" % name
            raise Exception(msg) from ex

    def get_beam_info(self):
        """
        Returns beam information retrieved by the beam_info hardware object,
        containing position, size and shape.

        :return: Beam info dictionary with keys: position, shape, size_x, size_y
        :rtype: dict
        """
        beam = HWR.beamline.beam
        beam_info_dict = {
            "position": [],
            "shape": "",
            "size_x": 0,
            "size_y": 0,
        }
        sx, sy, shape, _label = beam.get_value()

        if beam is not None:
            beam_info_dict.update(
                {
                    "position": beam.get_beam_position_on_screen(),
                    "size_x": sx,
                    "size_y": sy,
                    "shape": shape.value,
                }
            )

        aperture_list, current_aperture = self.get_aperture()

        beam_info_dict.update(
            {
                "apertureList": aperture_list,
                "currentAperture": current_aperture,
            }
        )

        return beam_info_dict

    def prepare_beamline_for_sample(self):
        if hasattr(HWR.beamline.collect, "prepare_for_new_sample"):
            HWR.beamline.collect.prepare_for_new_sample()

    def diffractometer_set_phase(self, phase):
        try:
            HWR.beamline.diffractometer.wait_device_ready(30)
        except Exception:
            logging.getLogger("MX3.HWR").warning("Diffractometer not ready")

        HWR.beamline.diffractometer.set_phase(phase)

    def set_aperture(self, pos):
        beam = HWR.beamline.beam
        msg = "Changing beam size to: %s" % pos
        logging.getLogger("MX3.HWR").info(msg)
        beam.set_value(pos)

    def diffractometer_get_info(self):
        ret = {}

        try:
            ret["useSC"] = HWR.beamline.diffractometer.use_sc
        except AttributeError:
            ret["useSC"] = False

        try:
            ret["currentPhase"] = HWR.beamline.diffractometer.get_current_phase()
        except AttributeError:
            ret["currentPhase"] = "None"

        try:
            ret["phaseList"] = HWR.beamline.diffractometer.get_phase_list()
        except AttributeError:
            ret["phaseList"] = []

        return ret

    def get_detector_info(self):
        try:
            filetype = HWR.beamline.detector.get_property("file_suffix")
        except Exception:
            filetype = None

        if filetype is None:
            filetype = "cbf"
            logging.getLogger("MX3.HWR").warning(
                "Detector file format not specified. Using cbf."
            )

        return filetype

    def display_image(self, path, img_num):
        res = {"path": "", "img": 0}

        if path:
            fpath, img = HWR.beamline.detector.get_actual_file_path(path, img_num)
            HWR.beamline.collect.adxv_notify(fpath, img)
            fpath = HWR.beamline.session.get_path_with_proposal_as_root(fpath)

            res = {"path": fpath, "img_num": img_num}

        return res
