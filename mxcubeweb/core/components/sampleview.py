# -*- coding: utf-8 -*-
import logging
import types
import sys
import os
import inspect

import PIL
import gevent.event

from flask import Response

from io import StringIO
import base64

from mxcubeweb.core.util.convertutils import to_camel, from_camel

from mxcubecore.queue_entry.base_queue_entry import CENTRING_METHOD
from mxcubecore.BaseHardwareObjects import HardwareObjectState
from mxcubecore.HardwareObjects.abstract.AbstractNState import (
    AbstractNState,
)


from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.components.component_base import ComponentBase


SNAPSHOT_RECEIVED = gevent.event.Event()
SNAPSHOT = None


class HttpStreamer:
    """
    Implements 'MJPEG' streaming from the sample view camera.

    Provides get_response() method, that creates a Response object,
    that will stream JPEG images from the sample view camera,
    in 'multipart' HTTP response format.
    """

    def __init__(self):
        self._new_frame = gevent.event.Event()
        self._sample_image = None
        self._clients = 0

    def _client_connected(self):
        if self._clients == 0:
            # first client connected,
            # start listening to frames from sample camera
            HWR.beamline.sample_view.camera.connect(
                "imageReceived", self._new_frame_received
            )

        self._clients += 1

    def _client_disconnected(self):
        self._clients -= 1
        if self._clients == 0:
            # last client disconnected,
            # disconnect from the sample camera
            HWR.beamline.sample_view.camera.disconnect(
                "imageReceived", self._new_frame_received
            )

    def _new_frame_received(self, img, width, height, *args, **kwargs):
        if isinstance(img, str):
            img = img
        elif isinstance(img, bytes):
            img = img
        else:
            rawdata = img.bits().asstring(img.numBytes())
            strbuf = StringIO()
            image = PIL.Image.frombytes("RGBA", (width, height), rawdata)
            (r, g, b, a) = image.split()
            image = PIL.Image.merge("RGB", (b, g, r))
            image.save(strbuf, "JPEG")
            img = strbuf.get_value()

        self._sample_image = img

        # signal clients that there is a new frame available
        self._new_frame.set()
        self._new_frame.clear()

    def get_response(self) -> Response:
        """
        build new Response object, that will send frames to the client
        """

        def frames():
            while True:
                self._new_frame.wait()
                yield (
                    b"--frame\r\n--!>\nContent-type: image/jpeg\n\n"
                    + self._sample_image
                    + b"\r\n"
                )

        self._client_connected()

        response = Response(
            frames(),
            mimetype='multipart/x-mixed-replace; boundary="!>"',
        )
        # keep track of when client stops reading the stream
        response.call_on_close(self._client_disconnected)

        return response


class SampleView(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)
        self._click_count = 0
        self._click_limit = 3
        self._centring_point_id = None
        self.http_streamer = HttpStreamer()

        enable_snapshots(
            HWR.beamline.collect,
            HWR.beamline.diffractometer,
            HWR.beamline.sample_view,
        )

        HWR.beamline.sample_view.connect("shapesChanged", self._emit_shapes_updated)

        zoom_motor = HWR.beamline.diffractometer.get_object_by_role("zoom")

        if zoom_motor:
            zoom_motor.connect("stateChanged", self._zoom_changed)

    def _zoom_changed(self, *args, **kwargs):
        ppm = HWR.beamline.diffractometer.get_pixels_per_mm()
        self.app.server.emit(
            "update_pixels_per_mm",
            {"pixelsPerMm": ppm},
            namespace="/hwr",
        )

    def _emit_shapes_updated(self):
        shape_dict = {}

        for shape in HWR.beamline.sample_view.get_shapes():
            _s = to_camel(shape.as_dict())
            shape_dict.update({shape.id: _s})

        self.app.server.emit("update_shapes", {"shapes": shape_dict}, namespace="/hwr")

    def centring_clicks_left(self):
        return self._click_limit - self._click_count

    def centring_reset_click_count(self):
        self._click_count = 0

    def centring_click(self):
        self._click_count += 1

    def centring_remove_current_point(self):
        if self._centring_point_id:
            HWR.beamline.sample_view.delete_shape(self._centring_point_id)
            self._emit_shapes_updated()
            self._centring_point_id = None

    def centring_add_current_point(self, *args):
        shape = HWR.beamline.sample_view.get_shape(self._centring_point_id)

        # There is no current centered point shape when the centring is done
        # by software like Workflows, so we add one.
        if not shape:
            try:
                if args[0]:
                    motors = args[1]["motors"]
                    (x, y) = HWR.beamline.diffractometer.motor_positions_to_screen(
                        motors
                    )
                    self.centring_update_current_point(motors, x, y)
                    shape = HWR.beamline.sample_view.get_shape(self._centring_point_id)
            except Exception:
                logging.getLogger("MX3.HWR").exception("Centring failed !")

        if shape:
            shape.state = "SAVED"
            self._emit_shapes_updated()
            self._centring_point_id = None

    def centring_update_current_point(self, motor_positions, x, y):
        point = HWR.beamline.sample_view.get_shape(self._centring_point_id)

        if point:
            point.move_to_mpos([motor_positions], [x, y])
        else:
            point = HWR.beamline.sample_view.add_shape_from_mpos(
                [motor_positions], (x, y), "P"
            )
            point.state = "TMP"
            point.selected = True
            self._centring_point_id = point.id

        self._emit_shapes_updated()

    def wait_for_centring_finishes(self, *args, **kwargs):
        """
        Executed when a centring is finished. It updates the temporary
        centred point.
        """

        try:
            centring_status = args[1]
        except IndexError:
            centring_status = {"valid": False}

        # we do not send/save any centring data if there is no sample
        # to avoid the 2d centring when no sample is mounted
        if self.app.sample_changer.get_current_sample().get("sampleID", "") == "":
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

            self.centring_update_current_point(motor_positions, x, y)

            if self.app.AUTO_MOUNT_SAMPLE:
                HWR.beamline.diffractometer.accept_centring()

    def init_signals(self):
        """
        Connect all the relevant hwobj signals with the corresponding
        callback method.
        """
        from mxcubeweb.routes import signals

        dm = HWR.beamline.diffractometer
        dm.connect("centringStarted", signals.centring_started)
        dm.connect("centringSuccessful", self.wait_for_centring_finishes)
        dm.connect("centringFailed", self.wait_for_centring_finishes)
        dm.connect("centringAccepted", self.centring_add_current_point)
        HWR.beamline.sample_view.connect("newGridResult", self.handle_grid_result)
        self._click_limit = int(HWR.beamline.click_centring_num_clicks or 3)

    def set_image_size(self, width, height):
        HWR.beamline.sample_view.camera.restart_streaming((width, height))
        return self.app.beamline.get_viewport_info()

    def move_to_centred_position(self, point_id):
        point = HWR.beamline.sample_view.get_shape(point_id)

        if point:
            motor_positions = point.get_centred_position().as_dict()
            HWR.beamline.diffractometer.move_motors(motor_positions)

        return point

    def get_shapes(self):
        shape_dict = {}

        for shape in HWR.beamline.sample_view.get_shapes():
            s = shape.as_dict()
            shape_dict.update({shape.id: s})

        return {"shapes": to_camel(shape_dict)}

    def get_shape_width_sid(self, sid):
        shape = HWR.beamline.sample_view.get_shape(sid)

        if shape is not None:
            shape = shape.as_dict()
            return {"shape": to_camel(shape)}

        return shape

    def shape_add_cell_result(self, sid, cell, result):
        from mxcubeweb.routes import signals

        shape = HWR.beamline.sample_view.get_shape(sid)
        shape.set_cell_result(cell, result)
        signals.grid_result_available(to_camel(shape.as_dict()))

    def handle_grid_result(self, shape):
        from mxcubeweb.routes import signals

        signals.grid_result_available(to_camel(shape.as_dict()))

    def update_shapes(self, shapes):
        updated_shapes = []

        for s in shapes:
            shape_data = from_camel(s)
            pos = []

            # Get the shape if already exists
            shape = HWR.beamline.sample_view.get_shape(shape_data.get("id", -1))

            # If shape does not exist add it
            if not shape:
                refs, t = shape_data.pop("refs", []), shape_data.pop("t", "")

                # Store pixels per mm for third party software, to facilitate
                # certain calculations

                beam_info_dict = beam_info_dict = self.app.beamline.get_beam_info()

                shape_data[
                    "pixels_per_mm"
                ] = HWR.beamline.diffractometer.get_pixels_per_mm()
                shape_data["beam_pos"] = (
                    beam_info_dict.get("position")[0],
                    beam_info_dict.get("position")[1],
                )
                shape_data["beam_width"] = beam_info_dict.get("size_x", 0)
                shape_data["beam_height"] = beam_info_dict.get("size_y", 0)

                # Shape does not have any refs, create a new Centered position
                if not refs:
                    try:
                        x, y = shape_data["screen_coord"]
                        mpos = HWR.beamline.diffractometer.get_centred_point_from_coord(
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
                            center_positions = HWR.beamline.diffractometer.get_centred_point_from_coord(
                                x_c, y_c, return_by_names=True
                            )
                            pos.append(center_positions)

                        shape = HWR.beamline.sample_view.add_shape_from_mpos(
                            pos, (x, y), t
                        )
                    except Exception:
                        logging.getLogger("HWR.MX3").info(shape_data)

                else:
                    shape = HWR.beamline.sample_view.add_shape_from_refs(refs, t)

            # shape will be none if creation failed, so we check if shape exists
            # before setting additional parameters
            if shape:
                shape.update_from_dict(shape_data)
                shape_dict = to_camel(shape.as_dict())
                updated_shapes.append(shape_dict)

        return {"shapes": updated_shapes}

    def rotate_to(self, sid):
        if sid:
            shape = HWR.beamline.sample_view.get_shape(sid)
            cp = shape.get_centred_position()
            phi_value = round(float(cp.as_dict().get("phi", None)), 3)
            if phi_value:
                try:
                    HWR.beamline.diffractometer.centringPhi.set_value(phi_value)
                except Exception:
                    raise

    def move_zoom_motor(self, pos):
        zoom_motor = HWR.beamline.diffractometer.get_object_by_role("zoom")
        if zoom_motor.get_state() != HardwareObjectState.READY:
            return (
                "motor is already moving",
                406,
                {
                    "Content-Type": "application/json",
                    "msg": "zoom already moving",
                },
            )

        if isinstance(zoom_motor, AbstractNState):
            zoom_motor.set_value(zoom_motor.value_to_enum(pos))
        else:
            zoom_motor.set_value(pos)

        scales = HWR.beamline.diffractometer.get_pixels_per_mm()
        return {"pixelsPerMm": [scales[0], scales[1]]}

    def back_light_on(self):
        motor = HWR.beamline.diffractometer.get_object_by_role("BackLightSwitch")
        motor.set_value(motor.VALUES.IN)

    def back_light_off(self):
        motor = HWR.beamline.diffractometer.get_object_by_role("BackLightSwitch")
        motor.set_value(motor.VALUES.OUT)

    def front_light_on(self):
        motor = HWR.beamline.diffractometer.get_object_by_role("FrontLightSwitch")
        motor.set_value(motor.VALUES.IN)

    def front_light_off(self):
        motor = HWR.beamline.diffractometer.get_object_by_role("FrontLightSwitch")
        motor.set_value(motor.VALUES.OUT)

    def move_motor(self, motid, newpos):
        motor = HWR.beamline.diffractometer.get_object_by_role(motid.lower())

        if newpos == "stop":
            motor.stop()
            return True
        else:
            motor.set_value(float(newpos))

            return True

    def start_auto_centring(self):
        """
        Start automatic (lucid) centring procedure.
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        if not HWR.beamline.diffractometer.current_centring_procedure:
            msg = "Starting automatic centring"
            logging.getLogger("user_level_log").info(msg)

            HWR.beamline.diffractometer.start_centring_method(
                HWR.beamline.diffractometer.C3D_MODE
            )
        else:
            msg = "Could not starting automatic centring, already centring."
            logging.getLogger("user_level_log").info(msg)

    def start_manual_centring(self):
        """
        Start 3 click centring procedure.
            :statuscode: 200: no error
            :statuscode: 409: error
        """
        if HWR.beamline.diffractometer.is_ready():
            if HWR.beamline.diffractometer.current_centring_procedure:
                logging.getLogger("user_level_log").info(
                    "Aborting current centring ..."
                )
                HWR.beamline.diffractometer.cancel_centring_method(reject=True)

            logging.getLogger("user_level_log").info("Centring using 3-click centring")

            HWR.beamline.diffractometer.start_centring_method(
                HWR.beamline.diffractometer.MANUAL3CLICK_MODE
            )

            self.centring_reset_click_count()
        else:
            logging.getLogger("user_level_log").warning(
                "Diffracomter is busy, cannot start centering"
            )
            raise RuntimeError("Diffracomter is busy, cannot start centering")

        return {"clicksLeft": self.centring_clicks_left()}

    def abort_centring(self):
        try:
            logging.getLogger("user_level_log").info("User canceled centring")
            HWR.beamline.diffractometer.cancel_centring_method()
            self.centring_remove_current_point()
        except Exception:
            logging.getLogger("MX3.HWR").warning("Canceling centring failed")

    def centring_handle_click(self, x, y):
        if HWR.beamline.diffractometer.current_centring_procedure:
            HWR.beamline.diffractometer.imageClicked(x, y, x, y)
            self.centring_click()
        else:
            if not self.centring_clicks_left():
                self.centring_reset_click_count()
                HWR.beamline.diffractometer.cancel_centring_method()

                HWR.beamline.diffractometer.start_centring_method(
                    HWR.beamline.diffractometer.MANUAL3CLICK_MODE
                )

        return {"clicksLeft": self.centring_clicks_left()}

    def reject_centring(self):
        HWR.beamline.diffractometer.reject_centring()
        self.centring_remove_current_point()

    def move_to_beam(self, x, y):
        msg = "Moving point x: %s, y: %s to beam" % (x, y)
        logging.getLogger("user_level_log").info(msg)

        HWR.beamline.diffractometer.move_to_beam(x, y)

    def set_centring_method(self, method):
        if method == CENTRING_METHOD.LOOP:
            msg = "Using automatic loop centring when mounting samples"
            self.app.CENTRING_METHOD = CENTRING_METHOD.LOOP
        else:
            msg = "Using click centring when mounting samples"
            self.app.CENTRING_METHOD = CENTRING_METHOD.MANUAL

        logging.getLogger("user_level_log").info(msg)


def enable_snapshots(collect_object, diffractometer_object, sample_view):
    def _snapshot_received(data):
        snapshot_jpg = data.get("data", "")

        global SNAPSHOT
        SNAPSHOT = base64.b64decode(snapshot_jpg)
        SNAPSHOT_RECEIVED.set()

    def _do_take_snapshot(filename, bw=False):
        sample_view.save_snapshot(filename, overlay=False, bw=bw)

    def save_snapshot(self, filename, bw=False):
        sample_view.save_snapshot(filename, overlay=False, bw=bw)
        # _do_take_snapshot(filename, bw)

    def take_snapshots(self, snapshots=None, _do_take_snapshot=_do_take_snapshot):
        from mxcubeweb.app import MXCUBEApplication as mxcube

        if snapshots is None:
            # called via AbstractCollect
            dc_params = self.current_dc_parameters
            move_omega_relative = diffractometer_object.move_omega_relative
        else:
            # called via AbstractMultiCollect
            # calling_frame = inspect.currentframe()
            calling_frame = inspect.currentframe().f_back.f_back

            dc_params = calling_frame.f_locals["data_collect_parameters"]
            move_omega_relative = diffractometer_object.phiMotor.set_value_relative

        if dc_params["take_snapshots"]:
            # The below does not work. NUM_SNAPSHOTS needs to e got in somehow
            number_of_snapshots = mxcube.NUM_SNAPSHOTS
        else:
            number_of_snapshots = 0

        if number_of_snapshots > 0:
            if (
                hasattr(diffractometer_object, "set_phase")
                and diffractometer_object.get_current_phase() != "Centring"
            ):
                use_custom_snapshot_routine = diffractometer_object.get_property(
                    "custom_snapshot_script_dir", None
                )
                if not use_custom_snapshot_routine:
                    logging.getLogger("user_level_log").info(
                        "Moving Diffractometer to CentringPhase Not done for tests (DN)"
                    )

                    diffractometer_object.set_phase("Centring", wait=True, timeout=200)

            snapshot_directory = dc_params["fileinfo"]["archive_directory"]
            if not os.path.exists(snapshot_directory):
                try:
                    self.create_directories(snapshot_directory)
                except Exception:
                    logging.getLogger("MX3.HWR").exception(
                        "Collection: Error creating snapshot directory"
                    )

            logging.getLogger("user_level_log").info(
                "Taking %d sample snapshot(s)" % number_of_snapshots
            )

            for snapshot_index in range(number_of_snapshots):
                snapshot_filename = os.path.join(
                    snapshot_directory,
                    "%s_%s_%s.snapshot.jpeg"
                    % (
                        dc_params["fileinfo"]["prefix"],
                        dc_params["fileinfo"]["run_number"],
                        (snapshot_index + 1),
                    ),
                )
                dc_params[
                    "xtalSnapshotFullPath%i" % (snapshot_index + 1)
                ] = snapshot_filename

                try:
                    logging.getLogger("MX3.HWR").info(
                        "Taking snapshot number: %d" % (snapshot_index + 1)
                    )
                    _do_take_snapshot(snapshot_filename)
                    # diffractometer.save_snapshot(snapshot_filename)
                except Exception as ex:
                    sys.excepthook(*sys.exc_info())
                    raise RuntimeError(
                        "Could not take snapshot '%s'",
                        snapshot_filename,
                    ) from ex

                if number_of_snapshots > 1:
                    move_omega_relative(90)
                    diffractometer_object.wait_ready()

    collect_object.take_crystal_snapshots = types.MethodType(
        take_snapshots, collect_object
    )

    diffractometer_object.save_snapshot = types.MethodType(
        save_snapshot, diffractometer_object
    )

    sample_view.set_ui_snapshot_cb(save_snapshot)
