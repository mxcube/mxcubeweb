from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from flask import Response, jsonify, request
from flask_restx import Namespace, Resource

import os
import json

from mxcube3 import mxcube
from mxcube3 import blcontrol
from mxcube3.core import beamlineutils
from mxcube3.core import sviewutils
from mxcube3.core import loginutils
from mxcube3.core import models

ns = Namespace(
    "sampleview",
    description="SampleView operations",
    path="/mxcube/api/v0.1/sampleview",
    decorators=[loginutils.valid_login_only]
)


sample_view_model = models.register_model(ns, models.SampleViewDataModel)
camera_width_height_model =  models.register_model(ns, models.WidthHeightModel)
zoom_level_model =models.register_model(ns, models.ZoomLevelModel)
pixels_per_mm_model = models.register_model(ns, models.PixelsPermmModel)
clicks_left_model = models.register_model(ns, models.ClicksLeftModel)
screen_position_model =models.register_model(ns, models.ScreenPositionModel)
click_position_model = models.register_model(ns, models.ClickPositionModel)
centring_method_model = models.register_model(ns, models.CentringMethodModel)


@ns.route("/camera/subscribe")
class CameraSubscribeResource(Resource):
    @ns.doc("Subscribe to camera")
    @ns.response(200, "MJPEG stream")
    @ns.produces('multipart/x-mixed-replace; boundary="!>"')
    def get(self):
        """
        Subscribe to the camera stream
        """
        if mxcube.VIDEO_DEVICE and os.path.exists(mxcube.VIDEO_DEVICE):
            result = Response(status=200)
        else:
            frame = sviewutils.stream_video(blcontrol.beamline.sample_view.camera)
            result = Response(frame, mimetype='multipart/x-mixed-replace; boundary="!>"')

        return result

    @ns.doc("Kill video streaming")
    @ns.response(200, "")
    def delete(self):
        blcontrol.beamline.sample_view.camera.streaming_greenlet.kill()
        return Response(status=200)


@ns.route("/camera/save")
class CameraSaveResource(Resource):
    @ns.doc("Save camera snapshot")
    @ns.response(200, "True on success False on failure")
    @ns.produces("String True or False")
    def put(self):
        """
        Save snapshot of the sample view
        """
        try:
            blcontrol.beamline.sample_view.camera.takeSnapshot(
                os.path.join(os.path.dirname(__file__), "snapshots/")
            )
            return "True"
        except Exception:
            return "False"


@ns.route("/camera")
@ns.response(409, "on error")
class CameraResource(Resource):
    @ns.doc("Get information about the current sampleview, image size, beam center")
    @ns.marshal_with(sample_view_model)
    def get(self):
        data = beamlineutils.get_viewport_info()
        return data, 200

    @ns.doc("Set the sample view video image size")
    @ns.expect(camera_width_height_model)
    @ns.marshal_with(sample_view_model)
    def post(self):
        params = ns.payload
        res = sviewutils.set_image_size(params["width"], params["height"])
        return res, 200


@ns.route("/centring/<point_id>/moveto")
@ns.response(409, "Could not move to position")
@ns.param('point_id', 'Id of centered postion to move to')
class CentringResource(Resource):
    @ns.response(200, "")
    @loginutils.require_control
    def put(self, point_id):
        """
        Move to the given centred position.
        """
        point = sviewutils.move_to_centred_position(point_id)

        if point:
            return Response(status=200)
        else:
            return Response(status=409)


@ns.route("/shapes")
@ns.response(409, "Shape not found")
class ShapesResource(Resource):
    @ns.doc("Get all registred shapes")
    @ns.response(200, "Shapes object")
    @ns.produces("application/json {shapes: sid1: {...}, sidN: {...}}")
    def get(self):
        """
        Retrieve all the saved shapes
        """
        shapes = sviewutils.get_shapes()

        resp = jsonify(shapes)
        resp.status_code = 200
        return resp

    @ns.doc("Update or add a set of shapes, contained in a list")
    @ns.response(200, "List with updated shape obejcts")
    @ns.produces("application/json [s1, ... sN}")
    def post(self):
        """
        Update or add a set of shapes, contained in a list
        """
        resp = Response(status=409)
        shapes = request.get_json().get("shapes", [])

        resp = jsonify(sviewutils.update_shapes(shapes))
        resp.status_code = 200

        return resp


@ns.route("/shapes/<sid>")
@ns.response(409, "Shape not found")
class ShapeResource(Resource):
    @ns.doc("Retrieve shape with id <sid>")
    @ns.response(200, "Shape obejcts")
    @ns.produces("application/json")
    def get(self, sid):
        """
        Retrieve shape with id <sid>
        """
        shape = sviewutils.get_shapes()

        if shape is not None:
            resp = jsonify(shape)
            resp.status_code = 200
            return resp
        else:
            return Response(status=409)
    
    @ns.doc("Update result for a cell in the grid with id <sid>")
    @ns.response(200, "")
    @ns.produces("application/json")
    def post(self, sid):
        params = request.get_json()

        cell_number = params.get("cell", 0)
        result = params.get("result", 0)

        sviewutils.shape_add_cell_result(sid, cell_number, result)
        return Response(status=200)

    @ns.doc("Delete shape with id <sid>")
    @ns.response(200, "")
    @ns.produces("application/json")
    def delete(self, sid):
        """
        Delete shape with id <sid>
        """
        blcontrol.beamline.sample_view.delete_shape(sid)
        return Response(status=200)


@ns.route("/shapes/rotate_to")
@ns.response(409, "Could not rotate to position defined by shape")
class RotateToShapeResource(Resource):
    @ns.doc("Rotate Omega to the position where the given shape was defined")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def post(self):
        """
        Rotate Omega to the position where the given shape was defined
        """
        sid = request.get_json().get("sid", -1)

        try:
            sviewutils.rotate_to(sid)
        except Exception:
            resp = Response(status=409)
        else:
            resp = Response(status=200)

        return resp


@ns.route("/zoom")
@ns.response(409, "Could not change zoom")
class ZoomResource(Resource):
    @ns.doc("Change zoom")
    @ns.expect(zoom_level_model)
    @ns.marshal_with(pixels_per_mm_model)
    @loginutils.require_control
    def put(self):
        params = ns.payload
        pos = params.get("level", 0)

        res = sviewutils.move_zoom_motor(pos)
        return res, 200


@ns.route("/backlighton")
@ns.response(409, "Could not turn on back light")
class BackLightOnResource(Resource):
    @ns.doc("Turn backlight on")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        sviewutils.back_light_on()
        return Response(status=200)


@ns.route("/backlightoff")
@ns.response(409, "Could not turn off back light")
class BackLightOffResource(Resource):
    @ns.doc("Turn backlight off")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        sviewutils.back_light_off()
        return Response(status=200)

@ns.route("/frontlighton")
@ns.response(409, "Could not turn on front light")
class FrontLightOnResource(Resource):
    @ns.doc("Turn frontlight on")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        sviewutils.front_light_on()
        return Response(status=200)


@ns.route("/frontlightoff")
@ns.response(409, "Could not turn off front light")
class FrontLightOffResource(Resource):
    @ns.doc("Turn frontlight off")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        sviewutils.front_light_off()
        return Response(status=200)


@ns.route("/<motid>/<newpos>")
@ns.param('mot_id', 'Id of motor to move')
@ns.param('newpos', 'Position to move to')
class MoveMotorResource(Resource):
    @ns.doc("Move motor with <mot_id> to new position <newpos>")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self, motid, newpos):
        try:
            sviewutils.move_motor(motid, newpos)
        except Exception as ex:
            return (
                "Could not move motor %s" % str(ex),
                406,
                {"Content-Type": "application/json", "msg": str(ex)},
            )
        else:
            return Response(status=200)


@ns.route("/<motid>")
@ns.param('mot_id', 'Id of motor')
@ns.response(409, "On error")
class MotorResource(Resource):
    @ns.doc("Get status, sate and position, of motor with id <motid>")
    @ns.response(200, "")
    @ns.produces("application/json")
    def get(self, motid):
        try:
            ret = sviewutils.get_status_of_id(motid)
            resp = jsonify(ret)
            resp.status_code = 200
            return resp
        except Exception:
            return Response(status=409)


@ns.route("/centring/startauto")
class StartAutoCentringResource(Resource):
    @ns.doc("Start automatic centring")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        sviewutils.start_auto_centring()
        return Response(status=200)


@ns.route("/centring/start3click")
class StartManualCentringResource(Resource):
    @ns.doc("Start 3-click centring")
    @ns.produces("application/json")
    @ns.marshal_with(clicks_left_model)
    @loginutils.require_control
    def put(self):
        data = sviewutils.start_manual_centring()
        return data, 200


@ns.route("/centring/abort")
class AbortCentringResource(Resource):
    @ns.doc("Abort current centring")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        sviewutils.abort_centring()
        return Response(status=200)


@ns.route("/centring/click")
class CentringClickResource(Resource):
    @ns.doc("Abort current centring")
    @ns.produces("application/json")
    @ns.expect(click_position_model)
    @ns.marshal_with(clicks_left_model)
    @loginutils.require_control
    def put(self):
        pos = ns.payload.get("clickPos", None)
        data = sviewutils.centring_handle_click(pos["x"], pos["y"])
        return data, 200


@ns.route("/centring/accept")
class AcceptCentringResource(Resource):
    @ns.doc("Accept current centring")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        blcontrol.beamline.diffractometer.accept_centring()
        return Response(status=200)


@ns.route("/centring/reject")
class AcceptCentringResource(Resource):
    @ns.doc("Reject current centring")
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        sviewutils.reject_centring()
        return Response(status=200)


@ns.route("/centring/centring_method")
class SetCentringMethodResource(Resource):
    @ns.doc("Set defualt centring method: MANUAL, LOOP, FULLY_AUTOMATIC, XRAY")
    @ns.expect(centring_method_model)
    @ns.response(200, "")
    @ns.produces("application/json")
    @loginutils.require_control
    def put(self):
        method = ns.payload.get("centringMethod", None)
        sviewutils.set_centring_method(method)
        return Response(status=200)


@ns.route("/centring/movetobeam")
class MoveToBeamResource(Resource):
    @ns.doc("Move position to beam")
    @ns.produces("application/json")
    @ns.response(200, "")
    @ns.expect(click_position_model)
    @loginutils.require_control
    def put(self):
        pos = ns.payload.get("clickPos", None)
        sviewutils.move_to_beam(pos["x"], pos["y"])
        return Response(status=200)