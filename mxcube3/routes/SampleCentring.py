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

from queue_entry import CENTRING_METHOD


SAMPLE_IMAGE = None
CLICK_COUNT = 0
CLICK_LIMIT = 3
CENTRING_POINT_ID = None


def centring_clicks_left():
    global CLICK_COUNT, CLICK_LIMIT
    return CLICK_LIMIT - CLICK_COUNT


def centring_reset_click_count():
    global CLICK_COUNT
    CLICK_COUNT = 0


def centring_click():
    global CLICK_COUNT
    CLICK_COUNT += 1


def centring_remove_current_point():
    global CENTRING_POINT_ID

    if CENTRING_POINT_ID:
        mxcube.shapes.delete_shape(CENTRING_POINT_ID)
        signals.send_shapes(update_positions = False)
        CENTRING_POINT_ID = None


def centring_add_current_point():
    global CENTRING_POINT_ID
    shape = mxcube.shapes.get_shape(CENTRING_POINT_ID)

    if shape:
        shape.state = "SAVED"
        signals.send_shapes(update_positions = False)
        CENTRING_POINT_ID = None


def centring_update_current_point(motor_positions, x, y):
    global CENTRING_POINT_ID

    if CENTRING_POINT_ID:
        point = mxcube.shapes.get_shape(CENTRING_POINT_ID)
        point.move_to_mpos([motor_positions], [x, y])
    else:
        point = mxcube.shapes.\
                add_shape_from_mpos([motor_positions], (x, y), "P")
        point.state = "TMP"
        point.selected = True
        CENTRING_POINT_ID = point.id

    signals.send_shapes(update_positions = False)


def init_signals():
    """
    Connect all the relevant hwobj signals with the corresponding
    callback method.
    """
    dm = mxcube.diffractometer

    for motor in dm.centring_motors_list:
        @Utils.RateLimited(3)
        def pos_cb(pos, motor=motor, **kw):
            movable = Utils.get_movable_state_and_position(motor)

            if movable:
                signals.motor_position_callback(movable[motor])
            else:
                logging.getLogger('HWR').exception("Could not call position callback for %s" % motor)

        def state_cb(state, motor=motor, **kw):
            movable = Utils.get_movable_state_and_position(motor)

            if movable:
                signals.motor_state_callback(movable[motor], **kw)
            else:
                logging.getLogger('HWR').exception("Could not call state callback for %s" % motor)

        setattr(dm, "_%s_pos_callback" % motor, pos_cb)
        setattr(dm, "_%s_state_callback" % motor, state_cb)
        dm.connect(dm.getObjectByRole(motor), "positionChanged", pos_cb)
        dm.connect(dm.getObjectByRole(motor), "stateChanged", state_cb)

    for motor in  ['FrontLight', 'BackLight']:
        def state_cb(state, motor=motor, **kw):
            movable = Utils.get_movable_state_and_position(motor)
            signals.motor_state_callback(movable[motor], **kw)
            signals.motor_state_callback(movable[motor + "Switch"], **kw)

        setattr(dm, "_%s_state_callback" % motor, state_cb)

        try:
            motor_hwobj = dm.getObjectByRole(motor)
            motor_hwobj.connect(motor_hwobj, 'positionChanged', state_cb)

            if hasattr(motor_hwobj, "actuatorIn"):
                motor_hwobj = dm.getObjectByRole(motor)
                motor_hwobj.connect(motor_hwobj, 'actuatorStateChanged', state_cb)
            else:
                motor_sw_hwobj = dm.getObjectByRole(motor + 'Switch')
                motor_sw_hwobj.connect(motor_sw_hwobj, 'actuatorStateChanged', state_cb)

        except Exception as ex:
            logging.getLogger('HWR').exception(str(ex))

    dm.connect("centringStarted", signals.centring_started)
    dm.connect(dm, "centringSuccessful", wait_for_centring_finishes)
    dm.connect(dm, "centringFailed", wait_for_centring_finishes)

    global CLICK_LIMIT
    CLICK_LIMIT = int(mxcube.beamline.\
                      getProperty('click_centring_num_clicks') or 3)

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
        mxcube.diffractometer.camera.\
            disconnect("imageReceived", new_sample_video_frame_received)
    except KeyError:
        pass

    mxcube.diffractometer.camera.\
        connect("imageReceived", new_sample_video_frame_received)

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
    if streaming.VIDEO_DEVICE:
        result = Response(status=200)
    else:
        result = Response(stream_video(mxcube.diffractometer.camera),
                          mimetype='multipart/x-mixed-replace; boundary="!>"')

    return result


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


@mxcube.route("/mxcube/api/v0.1/sampleview/shapes/<sid>", methods=['GET'])
def get_shape_with_sid(sid):
    """
    Retrieve requested shape information.
        :response Content-type: application/json, the stored centred positions.
        :statuscode: 200: no error
        :statuscode: 409: shape not found
    """
    shape = mxcube.shapes.get_shape(sid)

    if shape is not None:
        shape = shape.as_dict()
        resp = jsonify({"shape": to_camel(shape)})
        resp.status_code = 200
        return resp
    else:
        return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/sampleview/shape_mock_result/<sid>", methods=['GET'])
def shape_mock_result(sid):
    shape = mxcube.shapes.get_shape(sid)
    res = {}

    if shape:
        from random import random

        for i in range(1, shape.num_rows*shape.num_cols + 1):
            res[i] = [i, [int(random() * 255), int(random() * 255),
                          int(random() * 255), int(random())]]

        mxcube.shapes.set_grid_data(sid, res)
        signals.grid_result_available(to_camel(shape.as_dict()))

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/shapes", methods=['POST'])
def update_shapes():
    """
    Update shape information.
        :parameter shape_data: dict with shape information (id, type, ...)
        :response Content-type: application/json, the stored centred positions.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    resp = Response(status=409)
    params = request.get_json()
    shapes = params.get("shapes", [])
    updated_shapes = []
    
    for s in shapes:
        shape_data = from_camel(s);
        pos = []
    
        # Get the shape if already exists
        shape = mxcube.shapes.get_shape(shape_data.get("id", -1))
        
        # If shape does not exist add it
        if not shape:
            refs, t = shape_data.pop("refs", []), shape_data.pop("t", "")

            # Store pixels per mm for third party software, to facilitate
            # certain calculations

            beam_info_dict = beam_info_dict = beamlineutils.get_beam_info()

            shape_data["pixels_per_mm"] = mxcube.diffractometer.get_pixels_per_mm()
            shape_data["beam_pos"] = (beam_info_dict.get("position")[0],
                                      beam_info_dict.get("position")[1])

            # Shape does not have any refs, create a new Centered position
            if not refs:
                x, y = shape_data["screen_coord"]
                mpos = mxcube.diffractometer.\
                       get_centred_point_from_coord(x, y, return_by_names=True)
                pos.append(mpos)

                # We also store the center of the grid
                if t == 'G':
                    # coords for the center of the grid
                    x_c = x + (shape_data['num_cols'] / 2.0) * shape_data['cell_width']
                    y_c = y + (shape_data['num_rows'] / 2.0) * shape_data['cell_height']
                    center_positions = mxcube.diffractometer.\
                        get_centred_point_from_coord(x_c, y_c, return_by_names=True)
                    pos.append(center_positions)

                shape = mxcube.shapes.add_shape_from_mpos(pos, (x, y), t)

            else:
                shape = mxcube.shapes.add_shape_from_refs(refs, t)

        # shape will be none if creation failed, so we check if shape exists
        # before setting additional parameters
        if shape:
            shape.update_from_dict(shape_data)
            shape_dict = to_camel(shape.as_dict())
            updated_shapes.append(shape_dict)

    resp = jsonify({"shapes": updated_shapes})
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
    motor_hwobj = mxcube.diffractometer.getObjectByRole('BackLight')
    if hasattr(motor_hwobj, "actuatorIn"):
        motor_hwobj.actuatorIn()
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('BackLightSwitch')
        motor_hwobj.actuatorIn()

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/backlightoff", methods=['PUT'])
def back_light_off():
    """
    Switch off the backlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole('BackLight')

    if hasattr(motor_hwobj, "actuatorOut"):
        motor_hwobj.actuatorOut()
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('BackLightSwitch')
        motor_hwobj.actuatorOut()

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/frontlighton", methods=['PUT'])
def front_light_on():
    """
    Activate the frontlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole('FrontLight')

    if hasattr(motor_hwobj, "actuatorIn"):
        motor_hwobj.actuatorIn()
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('FrontLightSwitch')
        motor_hwobj.actuatorIn()

    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/frontlightoff", methods=['PUT'])
def front_light_off():
    """
    Switch off the frontlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole('FrontLight')
    if hasattr(motor_hwobj, "actuatorOut"):
        motor_hwobj.actuatorOut(wait=False)
    else:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('FrontLightSwitch')
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
    logging.getLogger('HWR.MX3').info('[Centring] 3click method requested')

    if mxcube.diffractometer.currentCentringProcedure:
        mxcube.diffractometer.cancelCentringMethod()

    mxcube.diffractometer.start3ClickCentring()
    centring_reset_click_count()
    data = {'clicksLeft': centring_clicks_left()}
    resp = jsonify(data)
    resp.status_code = 200
    return resp


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/abort", methods=['PUT'])
def abort_centring():
    """
    Abort centring procedure.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    logging.getLogger('HWR.MX3').info('[Centring] Abort method requested')
    mxcube.diffractometer.cancelCentringMethod()
    centring_remove_current_point()
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
        centring_click()   
    else:
        if not centring_clicks_left():
            centring_reset_click_count()
            mxcube.diffractometer.cancelCentringMethod()
            mxcube.diffractometer.start3ClickCentring()

    data = {'clicksLeft': centring_clicks_left()}
    resp = jsonify(data)
    resp.status_code = 200
    return resp


def wait_for_centring_finishes(*args, **kwargs):
    """
    Executed when a centring is finished. It updates the temporary
    centred point.
    """
    centring_status = args[1]

    # we do not send/save any centring data if there is no sample
    # to avoid the 2d centring when no sample is mounted
    if scutils.get_current_sample().get('sampleID', '') == '':
        return
    try:
        motor_positions = mxcube.diffractometer.centringStatus["motors"]
    except KeyError:
        msg = "[SAMPLEVIEW] Centring error, cannot retrieve motor positions."
        logging.getLogger('HWR').exception(msg)
        return

    # If centering is valid add the point, otherwise remove it
    if centring_status['valid']:
        motor_positions.pop('zoom', None)
        motor_positions.pop('beam_y', None)
        motor_positions.pop('beam_x', None)

        x, y = mxcube.diffractometer.motor_positions_to_screen(motor_positions)

        centring_update_current_point(motor_positions, x, y)
        mxcube.diffractometer.emit('stateChanged', (True,))


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/accept", methods=['PUT'])
def accept_centring():
    """
    Accept the centring position.
    """
    mxcube.diffractometer.acceptCentring()
    centring_add_current_point()

    return Response(status=200)



@mxcube.route("/mxcube/api/v0.1/sampleview/centring/reject", methods=['PUT'])
def reject_centring():
    """Reject the centring position."""

    mxcube.diffractometer.rejectCentring()
    centring_remove_current_point()

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


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/centring_method", methods=['PUT'])
def set_centring_method():
    """
    Set MXCuBE to use automatic (lucid) centring procedure when
    mounting samples

    :statuscode: 200: no error
    :statuscode: 409: error

    """
    params = json.loads(request.data)
    method = params.get("centringMethod", CENTRING_METHOD.LOOP)

    if method == CENTRING_METHOD.LOOP:
        msg = '[Centring] Using automatic loop centring when mounting samples'
        mxcube.CENTRING_METHOD =  CENTRING_METHOD.LOOP
    else:
        msg = '[Centring] Using click centring when mounting samples'
        mxcube.CENTRING_METHOD =  CENTRING_METHOD.MANUAL

    logging.getLogger('HWR.MX3').info(msg)

        
    return Response(status=200)
