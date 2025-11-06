import io
import logging
from typing import ClassVar

from flask import send_file
from mxcubecore import HardwareRepository as HWR
from mxcubecore import queue_entry as qe
from mxcubecore.HardwareObjects.abstract.AbstractSampleView import AbstractSampleView
from mxcubecore.queue_entry.base_queue_entry import CENTRING_METHOD

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.adaptermodels import Base64StrModel, ListOfShapesModel
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel
from mxcubeweb.core.util.convertutils import (
    from_camel,
    to_camel,
)

logger = logging.getLogger("MX3.HWR")

resource_handler_config = ResourceHandlerConfigModel(
    name="sample_view",
    attributes=[
        "get_value",
        "sample_image_meta_data",
        "shapes",
    ],
    commands=[
        "snapshot",
        "set_image_size",
        "move_to_centred_position",
        "update_shapes",
        "delete_shape",
        "rotate_to",
        "centre_click",
        "abort_centring",
        "click",
        "accept_centring",
        "move_to_beam",
        "set_centring_method",
        "start_click_centring",
    ],
)


class SampleViewAdapter(AdapterBase):
    """Adapter for AbstractSampleView — routes moved into adapter methods."""

    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractSampleView]

    def __init__(self, ho, role, app):
        super().__init__(ho, role, app, resource_handler_config)
        self._click_count = 0
        self._click_limit = int(HWR.beamline.config.click_centring_num_clicks or 3)
        self._centring_point_id = None

        self._ho.connect("shapesChanged", self._emit_shapes_updated)
        self._ho.connect("newGridResult", self._handle_grid_result)

        dm = HWR.beamline.diffractometer

        dm.connect("centringStarted", self._centring_started)
        dm.connect("centringSuccessful", self._wait_for_centring_finishes)
        dm.connect("centringFailed", self._wait_for_centring_finishes)
        dm.connect("centringAccepted", self._centring_add_current_point)

        zoom_motor = dm.get_object_by_role("zoom")

        if zoom_motor:
            zoom_motor.connect("stateChanged", self._zoom_changed)

    def _centring_add_current_point(self, *args):
        shape = self._ho.get_shape(self._centring_point_id)

        # There is no current centered point shape when the centring is done
        # by software like Workflows, so we add one.
        if not shape:
            try:
                if args[0]:
                    motors = args[1]["motors"]
                    (x, y) = HWR.beamline.diffractometer.motor_positions_to_screen(
                        motors
                    )
                    self._centring_update_current_point(motors, x, y)
                    shape = self._ho.get_shape(self._centring_point_id)
            except Exception:
                logging.getLogger("MX3.HWR").exception("Centring failed !")

        if shape:
            shape.state = "SAVED"
            self._emit_shapes_updated()
            self._centring_point_id = None

    def _centring_update_current_point(self, motor_positions, x, y):
        point = self._ho.get_shape(self._centring_point_id)

        if point:
            point.move_to_mpos([motor_positions], [x, y])
        else:
            point = self._ho.add_shape_from_mpos([motor_positions], (x, y), "P")
            point.state = "TMP"
            point.selected = True
            self._centring_point_id = point.id

        self._emit_shapes_updated()

    def _wait_for_centring_finishes(self, *args, **kwargs):  # noqa: ARG002
        """Executed when a centring is finished."""
        try:
            centring_status = args[1]
        except IndexError:
            centring_status = {"valid": False}

        # we do not send/save any centring data if there is no sample
        # to avoid the 2d centring when no sample is mounted
        if self.app.lims.get_current_sample().get("sampleID", "") == "":
            return

        # If centering is valid add the point, otherwise remove it
        if centring_status["valid"]:
            motor_positions = centring_status["motors"]
            motor_positions.pop("zoom", None)
            motor_positions.pop("beam_y", None)
            motor_positions.pop("beam_x", None)

            (x, y) = HWR.beamline.diffractometer.motor_positions_to_screen(
                motor_positions
            )

            self._centring_update_current_point(motor_positions, x, y)

            if self.app.AUTO_MOUNT_SAMPLE:
                HWR.beamline.diffractometer.accept_centring()

    def _centring_started(self, method, *args):  # noqa: ARG002
        msg = {"method": method}

        if method in ["Computer automatic"]:
            msg = {"method": qe.CENTRING_METHOD.LOOP}
        elif method in [HWR.beamline.diffractometer.CENTRING_METHOD_MANUAL]:
            msg = {"method": qe.CENTRING_METHOD.MANUAL}

        self.app.server.emit("sample_centring", msg, namespace="/hwr")

    def _zoom_changed(self, *args, **kwargs):  # noqa: ARG002
        ppm = HWR.beamline.diffractometer.get_pixels_per_mm()
        self.app.server.emit(
            "update_pixels_per_mm",
            {"pixelsPerMm": ppm},
            namespace="/hwr",
        )

    def _emit_shapes_updated(self):
        shape_dict = {}

        for shape in self._ho.get_shapes():
            _s = to_camel(shape.as_dict())
            shape_dict.update({shape.id: _s})

        self.app.server.emit("update_shapes", {"shapes": shape_dict}, namespace="/hwr")

    def _handle_grid_result(self, shape):
        self.app.server.emit(
            "grid_result_available", {"shape": shape}, namespace="/hwr"
        )

    def centring_clicks_left(self):
        return self._click_limit - self._click_count

    def centring_reset_click_count(self):
        self._click_count = 0

    def centring_click(self):
        self._click_count += 1

    def get_value(self) -> dict:
        return {}

    def sample_image_meta_data(self) -> dict:
        """Get information about current sample image.

        Returns a dictionary with the format:

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
            video_sizes = self._ho.camera.get_available_stream_sizes()
            (width, height, scale) = self._ho.camera.get_stream_size()
        else:
            scale = 1
            width = self._ho.camera.get_width()
            height = self._ho.camera.get_height()
            video_sizes = [(width, height)]

        pixels_per_mm = HWR.beamline.diffractometer.get_pixels_per_mm()

        return {
            "pixelsPerMm": pixels_per_mm,
            "imageWidth": width,
            "imageHeight": height,
            "format": fmt,
            "sourceIsScalable": source_is_scalable,
            "scale": scale,
            "videoSizes": video_sizes,
            "videoHash": self._ho.camera.stream_hash,
            "videoURL": self.app.CONFIG.app.VIDEO_STREAM_URL,
        }

    def shapes(self) -> list:
        return {shape.id: to_camel(shape.as_dict()) for shape in self._ho.get_shapes()}

    def snapshot(self, overlay: Base64StrModel):
        """Take snapshot of the sample view.

        data = {"overlay": overlay_data} overlay is the image data to overlay on sample
        image, it should normally contain the data of shapes drawn on canvas.
        Return: Overlayed image uri, if successful, statuscode 500 otherwise.
        """
        mimetype, overlay_data = overlay.value.split(",")

        if "image/jpeg" not in mimetype:
            msg = "Image type should be jpeg"
            self.app.server_logger.error("Taking a snapshot failed")
            self.app.server_logger.error(msg)
            raise ValueError(msg)

        try:
            image = self._ho.take_snapshot(overlay_data=overlay_data)
            data = io.BytesIO()
            image.save(data, "JPEG")
            data.seek(0)

            return send_file(
                data,
                mimetype="image/jpeg",
                as_attachment=True,
                download_name="snapshot.jpeg",
            )
        except Exception as e:
            self.app.server_logger.exception("Taking a snapshot failed")
            msg = "Taking a snapshot failed"
            raise RuntimeError(msg) from e

    def set_image_size(self, width: float, height: float) -> None:
        HWR.beamline.sample_view.camera.restart_streaming((width, height))
        return self.sample_image_meta_data()

    def move_to_centred_position(self, point_id: str):
        point = self._ho.move_to_centred_position(point_id)

        if not point:
            msg = "Could not move to centred position"
            raise RuntimeError(msg)

        return {}

    def update_shapes(self, shapes: ListOfShapesModel) -> dict:
        updated_shapes = []
        for s in shapes.shapes:
            shape_data = from_camel(s)
            dm = HWR.beamline.diffractometer
            pos = []

            # Get the shape if already exists
            shape = self._ho.get_shape(shape_data.get("id", -1))

            # If shape does not exist add it
            if not shape:
                refs, t = shape_data.pop("refs", []), shape_data.pop("t", "")
                state = shape_data.pop("state", "SAVED")
                user_state = shape_data.pop("user_state", "SAVED")

                # Store pixels per mm for third party software, to facilitate
                # certain calculations

                shape_data["pixels_per_mm"] = dm.get_pixels_per_mm()

                shape_data["beam_pos"] = (
                    HWR.beamline.beam.get_beam_position_on_screen()[0],
                    HWR.beamline.beam.get_beam_position_on_screen()[1],
                )
                shape_data["beam_width"] = HWR.beamline.beam.get_value()[0]
                shape_data["beam_height"] = HWR.beamline.beam.get_value()[1]

                # Shape does not have any refs, create a new Centered position
                if not refs:
                    try:
                        x, y = shape_data["screen_coord"]
                        mpos = dm.get_centred_point_from_coord(
                            x, y, return_by_names=True
                        )
                        pos.append(mpos)

                        # We also store the center of the grid
                        if t == "G":
                            # coords for the center of the grid
                            x_c = (
                                x
                                + (shape_data["num_cols"] / 2.0)
                                * shape_data["cell_width"]
                            )
                            y_c = (
                                y
                                + (shape_data["num_rows"] / 2.0)
                                * shape_data["cell_height"]
                            )
                            center_positions = dm.get_centred_point_from_coord(
                                x_c, y_c, return_by_names=True
                            )
                            pos.append(center_positions)

                        shape = self._ho.add_shape_from_mpos(
                            pos, (x, y), t, state, user_state
                        )
                    except Exception:
                        msg = "Could not create shape from screen coordinates"
                        logging.getLogger("MX3.HWR").exception(msg)
                        logging.getLogger("MX3.HWR").exception("")

                else:
                    shape = self._ho.add_shape_from_refs(refs, t, state, user_state)

            # shape will be none if creation failed, so we check if shape exists
            # before setting additional parameters
            if shape:
                shape.update_from_dict(shape_data)
                shape_dict = to_camel(shape.as_dict())
                updated_shapes.append(shape_dict)

        return {"shapes": updated_shapes}

    def delete_shape(self, sid: str):
        self._ho.delete_shape(sid)
        return {}

    def rotate_to(self, sid: str):
        try:
            self._ho.rotate_to(sid)
        except Exception as e:
            msg = "Rotate to shape failed"
            raise RuntimeError(msg) from e

        return {}

    def centre_click(self):
        try:
            return self._ho.start_manual_centring()
        except Exception as e:
            msg = "Could not start %s click centring"
            self.app.server_logger.exception(
                msg, self.app.beamline.config.click_centring_num_clicks
            )
            msg = "Could not start click centring"
            raise RuntimeError(msg) from e

    def abort_centring(self):
        self._ho.abort_centring()
        return {}

    def click(self, x: float, y: float):
        if HWR.beamline.diffractometer.current_centring_procedure:
            try:
                HWR.beamline.diffractometer.image_clicked(x, y)
                self.centring_click()
            except Exception:
                logging.getLogger("MX3.HWR").exception("")
                return {"clicksLeft": -1}

        elif not self.centring_clicks_left():
            self.centring_reset_click_count()
            HWR.beamline.diffractometer.cancel_centring_method()

            HWR.beamline.diffractometer.start_centring_method(
                HWR.beamline.diffractometer.CENTRING_METHOD_MANUAL
            )

        return {"clicksLeft": self.centring_clicks_left()}

    def accept_centring(self):
        HWR.beamline.diffractometer.accept_centring()
        return {}

    def move_to_beam(self, x: float, y: float):
        self._ho.move_to_beam(x, y)
        return {}

    def start_auto_centring(self):
        """Start automatic centring procedure."""
        if not HWR.beamline.diffractometer.current_centring_procedure:
            msg = "Starting automatic centring"
            logging.getLogger("user_level_log").info(msg)

            HWR.beamline.diffractometer.start_centring_method(
                HWR.beamline.diffractometer.C3D_MODE
            )
        else:
            msg = "Could not starting automatic centring, already centring."
            logging.getLogger("user_level_log").info(msg)

    def start_click_centring(self) -> dict:
        """Start click centring procedure.

        Returns:
            clicksLeft
        """
        if HWR.beamline.diffractometer.is_ready():
            if HWR.beamline.diffractometer.current_centring_procedure:
                logging.getLogger("user_level_log").info(
                    "Aborting current centring ..."
                )
                HWR.beamline.diffractometer.cancel_centring_method(reject=True)
            msg = "Centring using %s-click centring"
            logging.getLogger("user_level_log").info(
                msg, HWR.beamline.config.click_centring_num_clicks
            )

            HWR.beamline.diffractometer.start_centring_method(
                HWR.beamline.diffractometer.CENTRING_METHOD_MANUAL
            )

            self.centring_reset_click_count()
        else:
            logging.getLogger("user_level_log").warning(
                "Diffractometer is busy, cannot start centering"
            )
            msg = "Diffractometer is busy, cannot start centering"
            raise RuntimeError(msg)

        return {"clicksLeft": self.centring_clicks_left()}

    def set_centring_method(self, method):
        if method == CENTRING_METHOD.LOOP:
            msg = "Using automatic loop centring when mounting samples"
            HWR.beamline.queue_manager.centring_method = CENTRING_METHOD.LOOP
        else:
            msg = "Using click centring when mounting samples"
            HWR.beamline.queue_manager.centring_method = CENTRING_METHOD.MANUAL

        logging.getLogger("user_level_log").info(msg)

        return {}
