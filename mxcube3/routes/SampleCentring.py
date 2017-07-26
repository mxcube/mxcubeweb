from __future__ import absolute_import
from flask import Response, jsonify, request

import copy
import logging
import gevent.event
import os
import sys
import json
import PIL
import cStringIO
import subprocess

from mxcube3 import app as mxcube
from mxcube3.routes import Utils
from mxcube3.routes.transportutils import to_camel, from_camel
from mxcube3.routes import signals
from mxcube3.routes import scutils
from mxcube3.routes import beamlineutils
from mxcube3.video import streaming


SAMPLE_IMAGE = None
CLICK_COUNT = 0


def init_signals():
    """
    Connect all the relevant hwobj signals with the corresponding
    callback method.
    """
    for signal in signals.microdiffSignals:
        mxcube.diffractometer.connect(mxcube.diffractometer, signal,
                                      signals.motor_event_callback)
    for motor in mxcube.diffractometer.centring_motors_list:
        @Utils.RateLimited(3)
        def pos_cb(pos, motor=motor.lower(), **kw):
          signals.motor_position_callback(motor, pos)

        def state_cb(state, motor=motor.lower(), **kw):
          signals.motor_state_callback(motor, state, **kw)

        setattr(mxcube.diffractometer, "_%s_pos_callback" % motor, pos_cb)
        setattr(mxcube.diffractometer, "_%s_state_callback" % motor, state_cb)
        mxcube.diffractometer.connect(mxcube.diffractometer.getObjectByRole(motor.lower()),
                                      "positionChanged",
                                      pos_cb)
        mxcube.diffractometer.connect(mxcube.diffractometer.getObjectByRole(motor.lower()),
                                      "stateChanged",
                                      state_cb) #signals.motor_event_callback)
    try:
        frontlight_hwobj = mxcube.diffractometer.getObjectByRole('frontlight')
        frontlight_hwobj.connect(frontlight_hwobj, 'positionChanged',
                                 signals.motor_event_callback)
        if hasattr(frontlight_hwobj, "getActuatorState"):
            frontlight_hwobj.connect(frontlight_hwobj, 'actuatorStateChanged',
                                     signals.motor_event_callback)
        else:
            frontlightswitch_hwobj = mxcube.diffractometer.getObjectByRole(
                'frontlightswitch')
            frontlightswitch_hwobj.connect(frontlightswitch_hwobj,
                                           'actuatorStateChanged',
                                           signals.motor_event_callback)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] frontlight error')

    try:
        backlight_hwobj = mxcube.diffractometer.getObjectByRole('backlight')
        backlight_hwobj.connect(backlight_hwobj, 'positionChanged',
                                signals.motor_event_callback)
        if hasattr(backlight_hwobj, "getActuatorState"):
            backlight_hwobj.connect(backlight_hwobj, 'actuatorStateChanged',
                                    signals.motor_event_callback)
        else:
            backlightswitch_hwobj = mxcube.diffractometer.getObjectByRole(
                'backlightswitch')
            backlightswitch_hwobj.connect(backlightswitch_hwobj,
                                          'actuatorStateChanged',
                                          signals.motor_event_callback)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] back light error')

    mxcube.diffractometer.connect("centringStarted", signals.centring_started)
    mxcube.diffractometer.connect(mxcube.diffractometer, "centringSuccessful",
                                  wait_for_centring_finishes)
    mxcube.diffractometer.connect(mxcube.diffractometer, "centringFailed",
                                  wait_for_centring_finishes)

#   camera = mxcube.diffractometer.camera
#    streaming.set_video_size(camera.getWidth(), camera.getHeight())


def new_sample_video_frame_received(img, width, height, *args, **kwargs):
    """
    Executed when a new image is received, update the centred positions
    and set the gevent so the new image can be sent.
    """
    global SAMPLE_IMAGE

    # Assume that we are gettign a qimage if we are not getting a str,
    # to be able to handle data sent by hardware objects used in MxCuBE 2.x
    if not isinstance(img, str):
        rawdata = img.bits().asstring(img.numBytes())
        strbuf = cStringIO.StringIO()
        image = PIL.Image.frombytes("RGBA", (width, height), rawdata)
        (r, g, b, a) = image.split()
        image = PIL.Image.merge('RGB', (b, g, r))
        image.save(strbuf, "JPEG")
        img = strbuf.getvalue()

    SAMPLE_IMAGE = img

    mxcube.diffractometer.camera.new_frame.set()
    mxcube.diffractometer.camera.new_frame.clear()


def stream_video(camera_hwobj):
    """it just send a message to the client so it knows that there is a new
    image. A HO is supplying that image
    """
    global SAMPLE_IMAGE

    mxcube.diffractometer.camera.new_frame = gevent.event.Event()

    try:
        mxcube.diffractometer.camera.disconnect("imageReceived", new_sample_video_frame_received)
    except KeyError:
        pass

    mxcube.diffractometer.camera.connect("imageReceived", new_sample_video_frame_received)

    while True:
        try:
            camera_hwobj.new_frame.wait()
            yield 'Content-type: image/jpg\n\n' + SAMPLE_IMAGE + "\n--!>"
        except Exception:
            pass


@mxcube.route("/mxcube/api/v0.1/sampleview/camera/subscribe", methods=['GET'])
def subscribe_to_camera():
    """
    Subscribe to the camera streaming
        :response: image as html Content-type
    """
    return Response(stream_video(mxcube.diffractometer.camera),
                    mimetype='multipart/x-mixed-replace; boundary="!>"')


@mxcube.route("/mxcube/api/v0.1/sampleview/camera/unsubscribe", methods=['PUT'])
def unsubscribe_to_camera():
    """
    SampleCentring: unsubscribe from the camera streaming
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    mxcube.diffractometer.camera.streaming_greenlet.kill()
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/camera/save", methods=['PUT'])
def snapshot():
    """
    Save snapshot of the sample view
    data = {generic_data, "Path": path} # not sure if path should be available,
    or directly use the user/proposal path
    Return: 'True' if command issued succesfully, otherwise 'False'.
    """
    try:
        mxcube.diffractometer.camera.takeSnapshot(os.path.join(os.path.dirname(
            __file__), 'snapshots/'))
        return "True"
    except Exception:
        return "False"


@mxcube.route("/mxcube/api/v0.1/sampleview/camera", methods=['GET'])
def get_image_data():
    """
    Get size of the image of the diffractometer
        :response Content-type:application/json, example:
        {  "imageHeight": 576, "imageWidth": 768,
        "pixelsPerMm": [1661.1295681063123, 1661.1295681063123]
        }
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    data = beamlineutils.get_viewport_info()

    resp = jsonify(data)
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/sampleview/camera", methods=['POST'])
def set_image_size():
    """
    """
    params = request.get_json()
    streaming.set_video_size(params["width"], params["height"])
    data = beamlineutils.get_viewport_info()

    resp = jsonify(data)
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<point_id>/moveto", methods=['PUT'])
def move_to_centred_position(point_id):
    """
    Move to the given centred position.
        :parameter id: centred position identifier, integer
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    point = mxcube.shapes.get_shape('point_id')

    if point:
        motor_positions = point.get_centred_position().as_dict()
        mxcube.diffractometer.move_to_motors_positions(motor_positions)
        return Response(status=200)
    else:
        return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/sampleview/shapes", methods=['GET'])
def get_shapes():
    """
    Retrieve all the stored centred positions.
        :response Content-type: application/json, the stored centred positions.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    shape_dict = {}

    for shape in mxcube.shapes.get_shapes():
        s = shape.as_dict()
        shape_dict.update({shape.id: s})

    resp = jsonify({"shapes": to_camel(shape_dict)})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/sampleview/shapes", methods=['POST'])
def update_shapes():
    """
    Retrieve all the stored centred positions.
        :response Content-type: application/json, the stored centred positions.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    resp = Response(status=409)
    params = request.get_json()
    shape_data = from_camel(params.get("shapeData", {}))

    # Get the shape if already exists
    shape = mxcube.shapes.get_shape(params["id"])

    # If shape does not exist add it
    if not shape:
        refs, t = shape_data.pop("refs", []), shape_data.pop("t", "")

        # Shape does not have any refs, create a new Centered position
        if not refs:
            x, y = shape_data["screen_coord"]
            mpos = mxcube.diffractometer.get_centred_point_from_coord(x, y, return_by_names=True)
            shape = mxcube.shapes.add_shape_from_mpos([mpos], (x, y), t)
        else:
            shape = mxcube.shapes.add_shape_from_refs(refs, t)

    # shape will be none if creation failed, so we check if shape exists
    # before setting additional parameters
    if shape:
        shape.update_from_dict(shape_data)
        shape_dict = shape.as_dict()
        resp = jsonify(to_camel(shape_dict))
        resp.status_code = 200

    return resp


@mxcube.route("/mxcube/api/v0.1/sampleview/shapes/<sid>", methods=['DELETE'])
def delete_shape(sid):
    """
    Retrieve all the stored centred positions.
        :response Content-type: application/json, the stored centred positions.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    mxcube.shapes.delete_shape(sid)
    return Response(status=200)


# ### WORKING WITH MOVEABLES
zoom_levels = ["Zoom 0", "Zoom 1", "Zoom 2", "Zoom 3", "Zoom 4", "Zoom 5",
               "Zoom 6", "Zoom 7", "Zoom 8", "Zoom 9", "Zoom 10"]


@mxcube.route("/mxcube/api/v0.1/sampleview/zoom", methods=['PUT'])
def move_zoom_motor():
    """
    Move the zoom motor.
        :request Content-type: application/json, new position {'level': 4}.
        Note: level specified as integer (not 'Zoom 4')
        :response Content-type: application/json, new scale value,
        example: {"pixelsPerMm": [ 1661.1, 1661.1]}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    params = request.data
    params = json.loads(params)
    new_pos = params['level']
    zoom_motor = mxcube.diffractometer.getObjectByRole('zoom')
    if zoom_motor.getState() != 2:
        return 'motor is already moving', 406, {'Content-Type': 'application/json',
                                                'msg': 'zoom already moving'
                                                }

    logging.getLogger('HWR').info("Changing zoom level to: %s %s"
                                  % (new_pos, zoom_levels[int(new_pos)]))
    zoom_motor.moveToPosition(zoom_levels[int(new_pos)])
    scales = mxcube.diffractometer.get_pixels_per_mm()
    resp = jsonify({'pixelsPerMm': [scales[0], scales[1]]})
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/sampleview/backlighton", methods=['PUT'])
def back_light_on():
    """
    Activate the backlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole('backlight')
    if hasattr(motor_hwobj, "actuatorIn"):
        motor_hwobj.actuatorIn()  # wait=False)
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('backlightswitch')
        motor_hwobj.actuatorIn()  # wait=False)
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/backlightoff", methods=['PUT'])
def back_light_off():
    """
    Switch off the backlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole('backlight')
    if hasattr(motor_hwobj, "actuatorOut"):
        motor_hwobj.actuatorOut()
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('backlightswitch')
        motor_hwobj.actuatorOut()
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/frontlighton", methods=['PUT'])
def front_light_on():
    """
    Activate the frontlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole('frontlight')
    if hasattr(motor_hwobj, "actuatorIn"):
        motor_hwobj.actuatorIn()
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('frontlightswitch')
        motor_hwobj.actuatorIn()
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/frontlightoff", methods=['PUT'])
def front_light_off():
    """
    Switch off the frontlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole('frontlight')
    if hasattr(motor_hwobj, "actuatorOut"):
        motor_hwobj.actuatorOut(wait=False)
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('frontlightswitch')
        motor_hwobj.actuatorOut(wait=False)
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/<motid>/<newpos>", methods=['PUT'])
def move_motor(motid, newpos):
    """
        Move or Stop the given motor.
        :parameter motid: motor name, 'Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom',
        'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight',
        'Sampx', 'Sampy'
        :parameter newpos: new position, double, stop: string
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole(motid.lower())
    if newpos == "stop":
        motor_hwobj.stop()
        return Response(status=200)
    else:
        if motor_hwobj.getState() != 2:
            return 'motor is already moving', 406, {'Content-Type': 'application/json',
                                                    'msg': motid + ' already moving'
                                                    }
        limits = motor_hwobj.getLimits()
        if not limits[0] <= float(newpos) <= limits[1]:
            return 'position out of range', 406, {'Content-Type': 'application/json',
                                                  'msg': motid + ' position out of range, ' + str(limits)
                                                  }
        motor_hwobj.move(float(newpos))
        return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/<elem_id>", methods=['GET'])
def get_status_of_id(elem_id):
    """
    Get position and status of the given element
        :parameter id: moveable to get its status, 'Phi', 'Focus', 'PhiZ',
        'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch',
        'FrontLight','Sampx', 'Sampy'
        :response Content-type: application/json, {motorname:
            {'Status': status, 'position': position} }
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    if 'Light' in elem_id:
        ret = Utils.get_light_state_and_intensity()
    else:
        ret = Utils.get_movable_state_and_position(elem_id)
    if ret:
        resp = jsonify(ret)
        resp.status_code = 200
        return resp
    else:
        return Response(status=409)

# ### WORKING WITH THE SAMPLE CENTRING


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/startauto", methods=['PUT'])
def centre_auto():
    """
    Start automatic (lucid) centring procedure.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    logging.getLogger('HWR.MX3').info('[Centring] Auto centring method requested')
    mxcube.diffractometer.startAutoCentring()
    return Response(status=200)  # this only means the call was succesfull


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/start3click", methods=['PUT'])
def centre_3_click():
    """
    Start 3 click centring procedure.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    global CLICK_COUNT
    logging.getLogger('HWR.MX3').info('[Centring] 3click method requested')
    mxcube.diffractometer.start3ClickCentring()
    CLICK_COUNT = 0
    data = {'clickLeft': 3 - CLICK_COUNT}
    resp = jsonify(data)
    resp.status_code = 200
    return resp  # this only means the call was succesfull


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/abort", methods=['PUT'])
def abort_centring():
    """
    Abort centring procedure.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    logging.getLogger('HWR.MX3').info('[Centring] Abort method requested')
    current_centring_procedure = mxcube.diffractometer.cancelCentringMethod()
    return Response(status=200)  # this only means the call was succesfull


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/click", methods=['PUT'])
def click():
    """
    The 3-click method needs the input from the user, a running 3click centring procedure must be set before
        :request Content-type: application/json, integer positions of the clicks, {clickPos={"x": 123,"y": 456}}
        :response Content-type: application/json, integer, number of clicks left {'clickLeft': 3 | 2 | 1}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    global CLICK_COUNT

    if mxcube.diffractometer.currentCentringProcedure:
        params = request.data
        params = json.loads(params)
        click_position = params['clickPos']
        logging.getLogger('HWR').info("A click requested, x: %s, y: %s"
                                      % (click_position['x'],
                                         click_position['y']))
        mxcube.diffractometer.imageClicked(click_position['x'],
                                           click_position['y'],
                                           click_position['x'],
                                           click_position['y'])
        # we store the cpos as temporary, only when asked for save
        # it we switch the type
        CLICK_COUNT += 1
        data = {'clickLeft': 3 - CLICK_COUNT}
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    else:
        return Response(status=409)


def wait_for_centring_finishes(*args, **kwargs):
    """
    Executed when a centring is finished. It updates the temporary
    centred point.
    """
    # we do not send/save any centring data if there is no sample
    # to avoid the 2d centring when no sample is mounted
    if scutils.get_current_sample() == '':
        return
    try:
        motor_positions = mxcube.diffractometer.centringStatus["motors"]
    except KeyError:
        msg = "[SAMPLEVIEW] Centring error, cannot retrieve motor positions."
        logging.getLogger('HWR').exception(msg)
        return

    motor_positions.pop('zoom', None)
    motor_positions.pop('beam_y', None)
    motor_positions.pop('beam_x', None)

    x, y = mxcube.diffractometer.motor_positions_to_screen(motor_positions)
    point = mxcube.shapes.add_shape_from_mpos([motor_positions], (x, y), "P")
    point.state = "TMP"

    mxcube.diffractometer.emit('stateChanged', (True,))


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/accept", methods=['PUT'])
def accept_centring():
    """
    Accept the centring position.
    """
    mxcube.diffractometer.acceptCentring()
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/reject", methods=['PUT'])
def reject_centring():
    """Reject the centring position."""
    mxcube.diffractometer.rejectCentring()
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/movetobeam", methods=['PUT'])
def move_to_beam():
    """Go to the beam position from the given (x, y) position."""
    params = request.data
    params = json.loads(params)
    click_position = params['clickPos']
    logging.getLogger('HWR').info("A point submitted, x: %s, y: %s"
                                  % (click_position['x'],
                                     click_position['y']))
    if getattr(mxcube.diffractometer, 'moveToBeam') is None:
        # v > 2.2, or perhaps start_move_to_beam?
        mxcube.diffractometer.move_to_beam(click_position['x'], click_position['y'])
    else:
        # v <= 2.1
        mxcube.diffractometer.moveToBeam(click_position['x'], click_position['y'])
    return Response(status=200)
