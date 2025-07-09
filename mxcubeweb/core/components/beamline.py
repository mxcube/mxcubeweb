import logging

from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.adapter.beamline_adapter import BeamlineAdapter
from mxcubeweb.core.components.component_base import ComponentBase


class Beamline(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def init_signals(self):
        from mxcubeweb.routes import signals

        if HWR.beamline.xrf_spectrum:
            HWR.beamline.xrf_spectrum.connect(
                HWR.beamline.xrf_spectrum,
                "xrf_task_progress",
                signals.xrf_task_progress,
            )

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
        actions = []

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
            HWR.beamline.diffractometer.wait_ready(30)
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
