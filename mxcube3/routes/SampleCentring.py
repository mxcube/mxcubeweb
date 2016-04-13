from flask import request, Response, jsonify
from mxcube3 import app as mxcube
from PIL import Image, ImageDraw, ImageFont

import time
import logging
import collections
import gevent.event
import os
import json
import signals

SAMPLE_IMAGE = None
CLICK_COUNT = 0
posId = 1

def init_signals():
    for signal in signals.microdiffSignals:
        if signal in signals.motor_signals:
            mxcube.diffractometer.connect(mxcube.diffractometer, signal, signals.motor_event_callback)
        elif signal in signals.task_signals:
            mxcube.diffractometer.connect(mxcube.diffractometer, signal, signals.task_event_callback)
        else:
            pass
        #mxcube.diffractometer.connect(mxcube.diffractometer, signal, signals.signalCallback)
    mxcube.diffractometer.connect(mxcube.diffractometer, "centringSuccessful", waitForCentringFinishes)
    mxcube.diffractometer.connect(mxcube.diffractometer, "centringFailed", waitForCentringFinishes)
    mxcube.diffractometer.savedCentredPos = []
    mxcube.diffractometer.image_width = mxcube.diffractometer.camera.getWidth()
    mxcube.diffractometer.image_height = mxcube.diffractometer.camera.getHeight()

############

def new_sample_video_frame_received(img, width, height, *args, **kwargs):
    global SAMPLE_IMAGE
    for p in mxcube.diffractometer.savedCentredPos:
        x, y = mxcube.diffractometer.motor_positions_to_screen(p['motorPositions'])
        p.update({'x':x, 'y': y})
    SAMPLE_IMAGE = img
    mxcube.diffractometer.camera.new_frame.set()
    mxcube.diffractometer.camera.new_frame.clear()

def stream_video(camera_hwobj):
    """it just send a message to the client so it knows that there is a new image. A HO is supplying that image"""
    #logging.getLogger('HWR.Mx3').info('[Stream] Camera video streaming started')
    global SAMPLE_IMAGE
    while True:
        try:
            mxcube.diffractometer.camera.new_frame.wait()
            #logging.getLogger('HWR.MX3').info('[Stream] Camera video yielding')
            yield 'Content-type: image/jpg\n\n'+SAMPLE_IMAGE+"\n--!>"
        except Exception:
            pass

@mxcube.route("/mxcube/api/v0.1/sampleview/camera/subscribe", methods=['GET'])
def subscribeToCamera():
    """
    Subscribe to the camera streaming
        :response: image as html Content-type
    """
    #logging.getLogger('HWR').info('[Stream] Camera video streaming going to start')
    mxcube.diffractometer.camera.new_frame = gevent.event.Event()
    mxcube.diffractometer.camera.connect("imageReceived", new_sample_video_frame_received)
    mxcube.diffractometer.camera.streaming_greenlet = stream_video(mxcube.diffractometer.camera)
    return Response(mxcube.diffractometer.camera.streaming_greenlet, mimetype='multipart/x-mixed-replace; boundary="!>"')


@mxcube.route("/mxcube/api/v0.1/sampleview/camera/unsubscribe", methods=['PUT'])
def unsubscribeToCamera():
    """
    SampleCentring: unsubscribe from the camera streaming
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    try:
        mxcube.diffractometer.camera.streaming_greenlet.kill()
    except Exception:
        Response(status=409)
    return Response(status=200)

@mxcube.route("/mxcube/api/v0.1/sampleview/camera/save", methods=['PUT'])
def snapshot():
    """
    Save snapshot of the sample view
    data = {generic_data, "Path": path} # not sure if path should be available, or directly use the user/proposal path
    Return: 'True' if command issued succesfully, otherwise 'False'.
    """
    filenam = time.strftime("%Y-%m-%d-%H:%M:%S", time.gmtime())+sample.jpg
    try:
        mxcube.diffractometer.camera.takeSnapshot(os.path.join(os.path.dirname(__file__), 'snapshots/'))
        return "True"
    except:
        return "False"

@mxcube.route("/mxcube/api/v0.1/sampleview/camera", methods=['GET'])
def getImageData():
    """
    Get size of the image of the diffractometer
        :response Content-type:application/json, example: {  "imageHeight": 576, "imageWidth": 768, "pixelsPerMm": [1661.1295681063123, 1661.1295681063123]}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    try:
        data = {'pixelsPerMm': mxcube.diffractometer.get_pixels_per_mm(),
                'imageWidth':  mxcube.diffractometer.image_width,
                'imageHeight':  mxcube.diffractometer.image_height,
                }
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        return Response(status=409)

###----SAMPLE CENTRING----###
####
#To access parameters submitted in the URL (?key=value) you can use the args attribute:
#searchword = request.args.get('key', '')

#####  WORKING WITH CENTRING POSITIONS
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['GET'])
def getCentringWithId(id):
    """
    Get centring point data of the given centred position
        :parameter id: identifier of the stored centred position, integer
        :response Content-type:application/json, example: {"motorPositions": {"beam_x": 0.0, "beam_y": 0.0, "focus": -0.642, "kappa": null, "kappa_phi": null, "phi": 5.314e-05, "phiy": -0.145, "phiz": 0.0768, "sampx": -0.0918, "sampy": -0.0465, "zoom": 23487.5 }, "name": "pos1", "posId": 1, "selected": true, "type": "SAVED", "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    try:
        for cpos in mxcube.diffractometer.savedCentredPos:
            if cpos['posId'] == int(id):
                resp = jsonify(cpos)
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved, not found')
        return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<posid>", methods=['POST'])
def saveCentringWithId(posid):
    """
    Store the current temporary centring position in the server, a valid centring has to be done before this call, otherwise there will not be any temporary centred position.
        :parameter posid: any integer, only here for consistency
        :response Content-type: application/json, example: {"motorPositions": {"beam_x": 0.0, "beam_y": 0.0, "focus": -0.642, "kappa": null, "kappa_phi": null, "phi": 5.314e-05, "phiy": -0.145, "phiz": 0.0768, "sampx": -0.0918, "sampy": -0.0465, "zoom": 23487.5 }, "name": "pos1", "posId": 1, "selected": true, "type": "SAVED", "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    try:
        # unselect the any previous point
        for pos in mxcube.diffractometer.savedCentredPos:
            pos.update({'selected': False})
        #search for the temp point
        for pos in mxcube.diffractometer.savedCentredPos:
            if pos['type'] == 'TMP':
                pos.update({'type': 'SAVED', 'selected': True})
                resp = jsonify(pos)
                resp.status_code = 200
                return resp
        return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be saved')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['PUT'])
def updateCentringWithId(id):
    """
    Update the given centred position.
        :parameter id: centred position identifier, integer
        :request Content-type: application/json, an object containing the modified parameter(s)
        :response Content-type: application/json, example: {"motorPositions": {"beam_x": 0.0, "beam_y": 0.0, "focus": -0.642, "kappa": null, "kappa_phi": null, "phi": 5.314e-05, "phiy": -0.145, "phiz": 0.0768, "sampx": -0.0918, "sampy": -0.0465, "zoom": 23487.5 }, "name": "pos1", "posId": 1, "selected": true, "type": "SAVED", "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error    
    """
    params = request.data
    params = json.loads(params)
    try:
        for cpos in mxcube.diffractometer.savedCentredPos:
            if cpos['posId'] == id:
                cpos.update(params)
                resp = jsonify(cpos)
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved, not found')
        return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be updated')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<posid>", methods=['DELETE'])
def deleteCentringWithId(posid):
    """
    Delete the given centred position.
        :parameter id: centred position identifier, integer
        :response Content-type: application/json, deleted centred position, example: {"motorPositions": {"beam_x": 0.0, "beam_y": 0.0, "focus": -0.642, "kappa": null, "kappa_phi": null, "phi": 5.314e-05, "phiy": -0.145, "phiz": 0.0768, "sampx": -0.0918, "sampy": -0.0465, "zoom": 23487.5 }, "name": "pos1", "posId": 1, "selected": true, "type": "SAVED", "x": 200.641, "y": 288.197}
        :statuscode: 200: no error
        :statuscode: 409: error    
    """
    try:
        for cpos in mxcube.diffractometer.savedCentredPos:
            if cpos.get('posId') == int(posid):
                mxcube.diffractometer.savedCentredPos.remove(cpos)
                resp = jsonify(cpos)
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be deleted, not found')
        return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be deleted')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>/moveto", methods=['PUT'])
def moveToCentredPosition(id):
    """
    Move to the given centred position.
        :parameter id: centred position identifier, integer
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motorPositions = [d['motorPositions'] for d in mxcube.diffractometer.savedCentredPos if d.get('posId') == int(id)]
    try:
        mxcube.diffractometer.moveToCentredPosition(motorPositions)
        logging.getLogger('HWR.MX3').info('[Centring] moved to Centring Position')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR.MX3').info('[Centring] could not move to Centring Position')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring", methods=['GET'])
def getCentringPositions():
    """
    Retrieve all the stored centred positions.
        :response Content-type: application/json, all the stored centred positions, example:
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    aux = {}
    try:
        for p in mxcube.diffractometer.savedCentredPos:
            aux.update({p['posId']:p})
            x, y = mxcube.diffractometer.motor_positions_to_screen(p['motorPositions'])
            aux[p['posId']].update({'x':x, 'y': y})
        resp = jsonify(aux)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring positions could not be retrieved')
        return Response(status=409)

#### WORKING WITH MOVEABLES
zoomLevels = ["Zoom 1","Zoom 2","Zoom 3","Zoom 4","Zoom 5","Zoom 6","Zoom 7","Zoom 8","Zoom 9", "Zoom 10"]

@mxcube.route("/mxcube/api/v0.1/sampleview/zoom", methods=['PUT'])
def moveZoomMotor():
    """
    Move the zoom motor.
        :request Content-type: application/json, new position {'level': 4}. Note: level specified as integer (not 'Zoom 4')
        :response Content-type: application/json, new scale value, example: {"pixelsPerMm": [ 1661.1, 1661.1]}
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    params = request.data
    params = json.loads(params)
    newPos = params['level']
    zoomMotor = mxcube.diffractometer.getObjectByRole('zoom') 
    try:
        logging.getLogger('HWR').info("Changing zoom level to: %s" %newPos)
        zoomMotor.moveToPosition(zoomLevels[int(newPos)])
        scales = mxcube.diffractometer.get_pixels_per_mm()
        resp = jsonify({'pixelsPerMm': [scales[0],scales[1]]})
        resp.status_code = 200
        return resp
	return Response(status=200)
    except Exception:
        return Response(status=409)
@mxcube.route("/mxcube/api/v0.1/sampleview/backlighton", methods=['PUT'])
def backLightOn():
    """
    Activate the backlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    try:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('backlightswitch')
        motor_hwobj.actuatorIn(wait=False)
        return Response(status=200)
    except:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/backlightoff", methods=['PUT'])
def backLightOff():
    """
    Switch off the backlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error  
    """
    try:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('backlightswitch')
        motor_hwobj.actuatorOut(wait=False)
        return Response(status=200)
    except:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/frontlighton", methods=['PUT'])
def frontLightOn():
    """
    Activate the frontlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error  
    """
    try:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('frontlightswitch')
        motor_hwobj.actuatorIn(wait=False)
        return Response(status=200)
    except:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/frontlightoff", methods=['PUT'])
def frontLightOff():
    """
    Switch off the frontlight of the diffractometer.
        :statuscode: 200: no error
        :statuscode: 409: error  
    """
    try:
        motor_hwobj = mxcube.diffractometer.getObjectByRole('frontlightswitch')
        motor_hwobj.actuatorOut(wait=False)
        return Response(status=200)
    except:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/<motid>/<newpos>", methods=['PUT'])
def moveMotor(motid, newpos):
    """
        Move the given motor.
        :parameter motid: motor name, 'Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'
        :parameter newpos: new position, double
        :statuscode: 200: no error
        :statuscode: 409: error 
    """
    motor_hwobj = mxcube.diffractometer.getObjectByRole(motid.lower())
    try:
        motor_hwobj.move(float(newpos))
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could not move motor "%s" to position "%s"' %(motid, newpos))
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/<id>", methods=['GET'])
def get_status_of_id(id):
    """
    Get position and status of the given element
        :parameter id: moveable to get its status, 'Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'
        :response Content-type: application/json, {motorname: {'Status': status, 'position': position} }
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    data = {}
    motor = mxcube.diffractometer.getObjectByRole(id.lower())
    try:
        if motor.motor_name == 'Zoom':
            pos = motor_hwobj.predefinedPositions[motor_hwobj.getCurrentPositionName()]
            status = "unknown"
        elif mot == 'BackLightSwitch' or mot == 'FrontLightSwitch':
                states = {"in": 1, "out": 0}
                pos = states[motor_hwobj.getActuatorState()]  # {0:"out", 1:"in", True:"in", False:"out"}
                # 'in', 'out'
                status = pos 
        else:
            pos = motor.getPosition()
            status = motor.getState()
        data[motor.motor_name] = {'Status': status, 'position': pos}
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could get motor "%s" status ' % id)
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview", methods=['GET'])
def get_status():
    """
    Get position and status of all the elements: 'Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'
        :response Content-type: application/json, position and status of all moveables {motorname: {'Status': status, 'position': position} ...  }
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    motors = ['Phi', 'Focus', 'PhiZ', 'PhiY', 'Zoom', 'BackLightSwitch','BackLight','FrontLightSwitch', 'FrontLight','Sampx', 'Sampy'] 
    #'Kappa', 'Kappa_phi',
    data = {}
    try:
        for mot in motors:
            motor_hwobj = mxcube.diffractometer.getObjectByRole(mot.lower())
            if motor_hwobj is not None:
                if mot == 'Zoom':
                    pos = motor_hwobj.predefinedPositions[motor_hwobj.getCurrentPositionName()]
                    status = "unknown"
                elif mot == 'BackLightSwitch' or mot == 'FrontLightSwitch':
                    states = {"in": 1, "out": 0}
                    pos = states[motor_hwobj.getActuatorState()]  # {0:"out", 1:"in", True:"in", False:"out"}
                    # 'in', 'out'
                    status = pos 
                else:
                    try:
                        pos = motor_hwobj.getPosition()
                        status = motor_hwobj.getState()
                    except Exception:
                        logging.getLogger('HWR').exception('[SAMPLEVIEW] could not get "%s" motor' %mot)
                data[mot] = {'Status': status, 'position': pos}
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could not get all motor  status')
        return Response(status=409)

#### WORKING WITH THE SAMPLE CENTRING
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/startauto", methods=['PUT'])
def centreAuto():
    """
    Start automatic (lucid) centring procedure.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    logging.getLogger('HWR.MX3').info('[Centring] Auto centring method requested')
    try:
        mxcube.diffractometer.startAutoCentring()
        return Response(status=200)  # this only means the call was succesfull
    except Exception:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/start3click", methods=['PUT'])
def centre3click():
    """
    Start 3 click centring procedure.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    global CLICK_COUNT
    logging.getLogger('HWR.MX3').info('[Centring] 3click method requested')
    try:
        mxcube.diffractometer.start3ClickCentring()
        CLICK_COUNT = 0
        data = {'clickLeft': 3 - CLICK_COUNT}
        resp = jsonify(data)
        resp.status_code = 200
        return resp  # this only means the call was succesfull
    except:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/abort", methods=['PUT'])
def abortCentring():
    """
    Abort centring procedure.
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    logging.getLogger('HWR.MX3').info('[Centring] Abort method requested')
    try:
        currentCentringProcedure = mxcube.diffractometer.cancelCentringMethod()
        return Response(status=200)  # this only means the call was succesfull
    except:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/click", methods=['PUT'])
def aClick():
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
        clickPosition = params['clickPos']
        logging.getLogger('HWR').info("A click requested, x: %s, y: %s" %(clickPosition['x'], clickPosition['y']))
        try:
            mxcube.diffractometer.imageClicked(clickPosition['x'], clickPosition['y'], clickPosition['x'], clickPosition['y'])
            ## we store the cpos as temporary, only when asked for save it we switch the type
            CLICK_COUNT += 1
            data = {'clickLeft': 3 - CLICK_COUNT}
            resp = jsonify(data)
            resp.status_code = 200
            return resp
        except Exception:
            return Response(status=409)
    else:
        return Response(status=409)

def waitForCentringFinishes(*args, **kwargs):
    if mxcube.diffractometer.centringStatus["valid"]:

        mxcube.diffractometer.accept_centring()
        motorPositions = mxcube.diffractometer.centringStatus["motors"]
        x, y = mxcube.diffractometer.motor_positions_to_screen(motorPositions)
        # only store one temp point so override if any
        for pos in mxcube.diffractometer.savedCentredPos:
            if pos['type'] == 'TMP':
                index = mxcube.diffractometer.savedCentredPos.index(pos)
                data = {'name': pos['name'],
                    'posId': pos['posId'],
                    'motorPositions': motorPositions,
                    'selected': True,
                    'type': 'TMP',
                    'x': x,
                    'y': y 
                    }
                mxcube.diffractometer.savedCentredPos[index]= data
                mxcube.diffractometer.emit('minidiffStateChanged', (True,))
                return

        #if no temp point found, let's create the first one
        global posId
        centredPosId = 'pos' + str(posId) # pos1, pos2, ..., pos42
        data = {'name': centredPosId,
            'posId': posId,
            'motorPositions': motorPositions,
            'selected': True,
            'type': 'TMP',
            'x': x,
            'y': y 
            }
        posId += 1
        mxcube.diffractometer.savedCentredPos.append(data)
        mxcube.diffractometer.emit('minidiffStateChanged', (True,))

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/accept", methods=['PUT'])
def acceptCentring():
    """
    """
    try:
        mxcube.diffractometer.acceptCentring()
        return Response(status=200)
    except Exception:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/reject", methods=['PUT'])
def rejectCentring():
    """
    """
    try:
        mxcube.diffractometer.rejectCentring()
        return Response(status=200)
    except Exception:
        return Response(status=409)
