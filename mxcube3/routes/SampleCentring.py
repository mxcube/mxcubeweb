from flask import Response, jsonify, request

from mxcube3 import app as mxcube
from mxcube3.routes import Utils

import copy
import logging
import gevent.event
import os
import json
import signals
import PIL
import cStringIO

SAMPLE_IMAGE = None
CLICK_COUNT = 0


def init_signals():
    """
    Connect all the relevant hwobj signals with the corresponding
    callback method.
    """
    mxcube.diffractometer.savedCentredPos = []
    mxcube.diffractometer.savedCentredPosCount = 1
    for signal in signals.microdiffSignals:
        if signal in signals.motor_signals:
            mxcube.diffractometer.connect(mxcube.diffractometer, signal,
                                          signals.motor_event_callback)
        elif signal in signals.task_signals:
            mxcube.diffractometer.connect(mxcube.diffractometer,
                                          signal, signals.task_event_callback)
        else:
            pass
    for motor in mxcube.diffractometer.centring_motors_list:
        mxcube.diffractometer.connect(mxcube.diffractometer.getObjectByRole(motor.lower()),
                                      "positionChanged",
                                      signals.motor_event_callback)
        mxcube.diffractometer.connect(mxcube.diffractometer.getObjectByRole(motor.lower()),
                                      "stateChanged",
                                      signals.motor_event_callback)
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

    mxcube.diffractometer.connect(mxcube.diffractometer, "centringSuccessful",
                                  wait_for_centring_finishes)
    mxcube.diffractometer.connect(mxcube.diffractometer, "centringFailed",
                                  wait_for_centring_finishes)
    mxcube.diffractometer.camera.new_frame = gevent.event.Event()
    mxcube.diffractometer.camera.connect("imageReceived",
                                         new_sample_video_frame_received)
    mxcube.diffractometer.image_width = mxcube.diffractometer.camera.getWidth()
    mxcube.diffractometer.image_height = mxcube.diffractometer.camera.getHeight()

    mxcube.diffractometer.connect("centringStarted", signals.centring_started)
    

############


def new_sample_video_frame_received(img, width, height, *args, **kwargs):
    """
    Executed when a new image is received, update the centred positions
    and set the gevent so the new image can be sent.
    """
    global SAMPLE_IMAGE
    for point in mxcube.diffractometer.savedCentredPos:
        pos_x, pos_y = mxcube.diffractometer.motor_positions_to_screen(
            point['motor_positions'])
        point.update({'x': pos_x, 'y': pos_y})

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
    data = {'pixelsPerMm': mxcube.diffractometer.get_pixels_per_mm(),
            'imageWidth': mxcube.diffractometer.image_width,
            'imageHeight': mxcube.diffractometer.image_height,
            }
    resp = jsonify(data)
    resp.status_code = 200
    return resp

# ##----SAMPLE CENTRING----###
# ###
# To access parameters submitted in the URL (?key=value)
# you can use the args attribute:
# searchword = request.args.get('key', '')

# ####  WORKING WITH CENTRING POSITIONS


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<centring_id>", methods=['GET'])
def get_centring_with_id(centring_id):
    """
    Get centring point data of the given centred position
        :parameter id: identifier of the stored centred position, integer
        :response Content-type:application/json, example: {"motorPositions": {
        "beam_x": 0.0, "beam_y": 0.0, "focus": -0.642, "kappa": null,
        "kappa_phi": null, "phi": 5.314e-05, "phiy": -0.145, "phiz": 0.0768,
        "sampx": -0.0918, "sampy": -0.0465, "zoom": 23487.5 }, "name": "pos1",
        "posId": 1, "selected": true, "type": "SAVED",
        "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    for cpos in mxcube.diffractometer.savedCentredPos:
        if cpos['posId'] == int(centring_id):
            resp = jsonify(cpos)
            resp.status_code = 200
            return resp
    return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<posid>", methods=['POST'])
def save_centring_with_id(posid):
    """
    Store the current temporary centring position in the server, a valid
    centring has to be done before this call, otherwise there will not
    be any temporary centred position.
        :parameter posid: any integer, only here for consistency
        :response Content-type: application/json, example: {"motorPositions":
         {"beam_x": 0.0, "beam_y": 0.0, "focus": -0.642, "kappa": null,
         "kappa_phi": null, "phi": 5.314e-05, "phiy": -0.145, "phiz": 0.0768,
         "sampx": -0.0918, "sampy": -0.0465, "zoom": 23487.5 }, "name": "pos1",
         "posId": 1, "selected": true, "type": "SAVED",
         "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    # unselect the any previous point
    for pos in mxcube.diffractometer.savedCentredPos:
        pos.update({'selected': False})
    # search for the temp point
    for pos in mxcube.diffractometer.savedCentredPos:
        if pos['type'] == 'TMP':
            pos.update({'type': 'SAVED', 'selected': True})
            resp = jsonify(pos)
            resp.status_code = 200
            return resp
    return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<centring_id>", methods=['PUT'])
def update_centring_with_id(centring_id):
    """
    Update the given centred position.
        :parameter centring_id: centred position identifier, integer
        :request Content-type: application/json, an object containing the
        modified parameter(s)
        :response Content-type: application/json, example: {"motorPositions":
        {"beam_x": 0.0, "beam_y": 0.0, "focus": -0.642, "kappa": null,
        "kappa_phi": null, "phi": 5.314e-05, "phiy": -0.145, "phiz": 0.0768,
        "sampx": -0.0918, "sampy": -0.0465, "zoom": 23487.5 }, "name": "pos1",
        "posId": 1, "selected": true, "type": "SAVED",
        "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    params = request.data
    params = json.loads(params)
    for cpos in mxcube.diffractometer.savedCentredPos:
        if cpos['posId'] == centring_id:
            cpos.update(params)
            resp = jsonify(cpos)
            resp.status_code = 200
            return resp
    logging.getLogger('HWR').error('[SAMPLEVIEW] centring position could not'
                                   'be retrieved, not found')
    return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<posid>", methods=['DELETE'])
def delete_centring_with_id(posid):
    """
    Delete the given centred position.
        :parameter id: centred position identifier, integer
        :response Content-type: application/json, deleted centred position,
        example: {"motorPositions": {"beam_x": 0.0, "beam_y": 0.0,
        "focus": -0.642, "kappa": null, "kappa_phi": null, "phi": 5.314e-05,
        "phiy": -0.145, "phiz": 0.0768, "sampx": -0.0918, "sampy": -0.0465,
        "zoom": 23487.5 }, "name": "pos1", "posId": 1, "selected": true,
        "type": "SAVED", "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    for cpos in mxcube.diffractometer.savedCentredPos:
        if cpos.get('posId') == int(posid):
            mxcube.diffractometer.savedCentredPos.remove(cpos)
            resp = jsonify(cpos)
            resp.status_code = 200
            return resp
    logging.getLogger('HWR').error('[SAMPLEVIEW] centring position could'
                                   'not be deleted, not found')
    return Response(status=409)


@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<centring_id>/moveto", methods=['PUT'])
def move_to_centred_position(centring_id):
    """
    Move to the given centred position.
        :parameter id: centred position identifier, integer
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motor_positions = [d['motor_positions'] for d in mxcube.diffractometer.savedCentredPos if d.get('posId') == int(centring_id)]
    if 'kappa' in motor_positions[0]:
        motor_positions[0].pop('kappa')
    if 'kappa_phi' in motor_positions[0]:
        motor_positions[0].pop('kappa_phi')
    mxcube.diffractometer.move_to_motors_positions(
        copy.deepcopy(motor_positions[0]))
    logging.getLogger('HWR.MX3').info('[Centring] moved to Centring Position')
    return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/sampleview/centring", methods=['GET'])
def get_centring_positions():
    """
    Retrieve all the stored centred positions.
        :response Content-type: application/json, the stored centred positions.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    aux = {}
    for pos in mxcube.diffractometer.savedCentredPos:
        aux.update({pos['posId']: pos})
        pos_x, pos_y = mxcube.diffractometer.motor_positions_to_screen(
            pos['motor_positions'])
        aux[pos['posId']].update({'x': pos_x, 'y': pos_y})
    resp = jsonify(aux)
    resp.status_code = 200
    return resp


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
    motor_positions = mxcube.diffractometer.centringStatus["motors"]
    motor_positions.pop('zoom')
    motor_positions.pop('beam_y', None)
    motor_positions.pop('beam_x', None)
    pos_x, pos_y = mxcube.diffractometer.motor_positions_to_screen(motor_positions)
    # only store one temp point so override if any
    for pos in mxcube.diffractometer.savedCentredPos:
        if pos['type'] == 'TMP':
            index = mxcube.diffractometer.savedCentredPos.index(pos)
            data = {'name': pos['name'],
                    'posId': pos['posId'],
                    'motor_positions': motor_positions,
                    'selected': True,
                    'type': 'TMP',
                    'x': pos_x,
                    'y': pos_y
                    }
            mxcube.diffractometer.savedCentredPos[index] = data
            mxcube.diffractometer.emit('stateChanged', (True,))
            return

    # if no temp point found, let's create the first one
    centred_pos_id = 'pos' + str(mxcube.diffractometer.savedCentredPosCount)
    # pos1, pos2, ..., pos42
    data = {'name': centred_pos_id,
            'posId': mxcube.diffractometer.savedCentredPosCount,
            'motor_positions': motor_positions,
            'selected': True,
            'type': 'TMP',
            'x': pos_x,
            'y': pos_y
            }
    mxcube.diffractometer.savedCentredPosCount += 1
    mxcube.diffractometer.savedCentredPos.append(data)
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
