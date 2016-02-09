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

posId = 0

# ##all drawing to be moved into ~shapehistory...
def init_signals():
    for signal in signals.microdiffSignals:
        mxcube.diffractometer.connect(mxcube.diffractometer, signal, signals.signalCallback)
    camera_hwobj = mxcube.diffractometer.getObjectByRole("camera")
    mxcube.diffractometer.image_width = camera_hwobj.getWidth()
    mxcube.diffractometer.image_height = camera_hwobj.getHeight()

def drawBeam(draw):
    W = mxcube.diffractometer.image_width
    H = mxcube.diffractometer.image_height
    c = (W/2, H/2)
    r = 40  # real beam size...
    draw.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], outline = "blue")

def drawPoint(draw, p, selected):  #where p = (x, y)
    if selected:
        color = "yellow"
    else:
        color = "green"   
    r = 10
    d = 12
    draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], outline = color)
    draw.line((p[0] - d/2, p[1] - d/2, p[0] + d/2, p[1] + d/2), color, width = 2)
    draw.line((p[0] - d/2, p[1] + d/2 , p[0] + d/2, p[1] - d/2), color, width = 2)

def drawZoomLegend(draw, zoom):
    W = mxcube.diffractometer.image_width
    H = mxcube.diffractometer.image_height
    draw.line((10, H-50, 10, H-10), "green", width=3)
    #fnt = ImageFont.truetype('/usr/share/fonts/dejavu/DejaVuSans.ttf', 20)
    draw.text((15, H-45), str(zoom), "green")
    draw.line((10, H-10, 50, H-10), "green", width=3)
    draw.text((20, H-25), str(zoom), "green")

def drawTopLayer():
    W = mxcube.diffractometer.image_width
    H = mxcube.diffractometer.image_height
    img = Image.new("RGBA", (W, H), color=255)#(255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    try:
        zoomMotor = mxcube.diffractometer.getObjectByRole("zoom")
        pos = zoomMotor.getCurrentPositionName()
        if len(pos) == 0: pos = 'python rocks'
    except Exception:
        pos = 'react motherfucker'
    drawZoomLegend(draw, pos)
    for p in centredPos:
        drawPoint(draw, (p['x'], p['y']), p['selected'])
    drawBeam(draw)
    return img

############

def new_sample_video_frame_received(img, width, height, *args, **kwargs):
    camera_hwobj = mxcube.diffractometer.getObjectByRole("camera")
    global SAMPLE_IMAGE
    background = Image.open(camera_hwobj.image)
    #('/mxn/home/mikegu/mxcube3/test/HardwareObjectsMockup.xml/mxcube_sample_snapshot.jpeg', 'r')#.read()
    layer = drawTopLayer()
    background.paste(layer, (0, 0), layer)
    background.save("aux.jpg", "JPEG")
    SAMPLE_IMAGE = open( "aux.jpg", 'rb').read()
    camera_hwobj.new_frame.set()
    camera_hwobj.new_frame.clear()

def stream_video(camera_hwobj):
    """it just send a message to the client so it knows that there is a new image. A HO is supplying that image"""
    #logging.getLogger('HWR.Mx3').info('[Stream] Camera video streaming started')
    global SAMPLE_IMAGE
    while True:
        try:
            camera_hwobj.new_frame.wait()
            #logging.getLogger('HWR.MX3').info('[Stream] Camera video yielding')
            yield 'Content-type: image/jpg\n\n'+SAMPLE_IMAGE+"\n--!>"
        except Exception:
            pass

@mxcube.route("/mxcube/api/v0.1/sampleview/camera/subscribe", methods=['GET'])
def subscribeToCamera():
    """SampleCentring: subscribe to the camera streaming, used in img src tag
    Args: None
    Return: image as html Content-type
    """
    #logging.getLogger('HWR').info('[Stream] Camera video streaming going to start')
    camera_hwobj = mxcube.diffractometer.getObjectByRole("camera")
    camera_hwobj.new_frame = gevent.event.Event()
    camera_hwobj.connect("imageReceived", new_sample_video_frame_received)
    camera_hwobj.streaming_greenlet = stream_video(camera_hwobj)
    return Response(camera_hwobj.streaming_greenlet, mimetype='multipart/x-mixed-replace; boundary="!>"')


@mxcube.route("/mxcube/api/v0.1/sampleview/camera/unsubscribe", methods=['PUT'])
def unsubscribeToCamera():
    """
    SampleCentring: unsubscribe from the camera streaming
    Args: None
    Return: 'True' if streaming stopped succesfully, otherwise 'False'
    """
    camera_hwobj = mxcube.diffractometer.getObjectByRole("camera")
    try:
        camera_hwobj.streaming_greenlet.kill()
    except Exception:
        pass
    return "True"

@mxcube.route("/mxcube/api/v0.1/sampleview/camera/save", methods=['PUT'])
def snapshot():
    """
    Save snapshot of the sample view
    Args: None
    data = {generic_data, "Path": path} # not sure if path should be available, or directly use the user/proposal path
    Return: 'True' if command issued succesfully, otherwise 'False'.
    """
    filenam = time.strftime("%Y-%m-%d-%H:%M:%S", time.gmtime())+sample.jpg
    try:
        camera_hwobj.takeSnapshot(os.path.join(os.path.dirname(__file__), 'snapshots/'))
        return "True"
    except:
        return "False"

@mxcube.route("/mxcube/api/v0.1/sampleview/camera", methods=['GET'])
def getImageData():
    """
    Get size of the image of the diffractometer
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
clicks = collections.deque(maxlen=3)

centredPos = []
####
#To access parameters submitted in the URL (?key=value) you can use the args attribute:
#searchword = request.args.get('key', '')

#####  WORKING WITH CENTRING POSITIONS
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['GET'])
def getCentringWithId(id):
    """
    SampleCentring: get centring point position of point with id:"id", id=1,2,3...
    data = {generic_data, "point": id}
    return_data = {"id": {x,y}, error code 200/409}
    """
    try:
        for cpos in centredPos:
            if cpos[cpos.keys()[1]] == id:
                resp = jsonify(cpos)
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved, not found')
        return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['POST'])
def saveCentringWithId(id):
    """
    Store the current centring position in the server, there is not limit on how many positions can be stored
    Args: id, for consistency but not used
    Return: new centring position name (pos1, pos2...) plus motors' positions if the current centring position is retrieved and stored succesfully, otherwise '409' error code. In any case: str
    """
    # params = request.data
    # params = json.loads(params)
    # x, y = params['x'], params['y']
    centredPosId = 'pos' + str(len(centredPos)+1)
    global posId
    posId += 1
    print mxcube.diffractometer.centringStatus
    print mxcube.diffractometer.centring_status

    # unselect the any previous point
    for pos in centredPos:
        pos.update({'selected': False})
    #if request.args.get('rename',''): renaming option comes later
    try:
        mxcube.diffractometer.saveCurrentPos()
        motorPositions = mxcube.diffractometer.centringStatus["motors"]
        #motorPositions = {'focus': 0.69518381761112, 'kappa': 0.0009, 'kappa_phi': 311.0, 'phi': 0.34759190880556, 'phiy': 1.04277572641668, 'phiz': 1.39036763522224, 'sampx': 1.379595440278002, 'sampy': 2.08555145283336, 'zoom': 8.53}
        x, y = mxcube.diffractometer.motor_positions_to_screen(motorPositions)  # this is the x, y only a this moment

        data = {'name': centredPosId,
                'posId': posId,
                'motorPositions': motorPositions,
                'selected': True,
                'x': x,
                'y': y
                }
        centredPos.append(data)
        logging.getLogger('HWR.MX3').info('[Centring] Centring Positions saved:' + str(data))
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    # except AttributeError:
    #     data = {'name': centredPosId}
    #     centredPos.append(data)
    #     logging.getLogger('HWR.MX3').info('[Centring] Centring Positions saved:' + str(data))
    #     resp = jsonify(data)  # {'QueueId': nodeId} )
    #     resp.status_code = 200
    #     return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be saved')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['PUT'])
def updateCentringWithId(id):
    """SampleCentring: update centred position of point with id:"id", now only expected to be used for **renaming**
    data = {generic_data, "name": newName}
    return_data= updated entry plus error code 200/409
    """
    params = request.data
    params = json.loads(params)
    try:
        for cpos in centredPos:
            if cpos[cpos.keys()[1]] == id:
                cpos.update(params)
                resp = jsonify(cpos)
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved, not found')
        return Response(status=409)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be updated')
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['DELETE'])
def deleteCentringWithId(id):
    """SampleCentring: set centring point position of point with id:"id", id=1,2,3...
    data = {generic_data, "point": id, "position": {x,y}}
    return_data= removed entry plus error code 200/409
    """
    try:
        for cpos in centredPos:
            if cpos.get('posId') == id:
                centredPos.remove(cpos)
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
    Move all the motors involved in the centring to the given centring position
    Args: position, the name of the centring position (pos1, pos2, customName1,...)
        position: str
    Return: '200' if command issued succesfully, otherwise '409'.
    """
    motorPositions = [d['motorPositions'] for d in centredPos if d.get('name') == id]
    #or moveMotors(self, roles_positions_dict)???
    try:
        mxcube.diffractometer.moveToCentredPosition(motorPositions)
        logging.getLogger('HWR.MX3').info('[Centring] moved to Centring Position')
        return Response(status=200)
    except Exception:
        logging.getLogger('HWR.MX3').info('[Centring] could not move to Centring Position')
        return Response(status=409)

#### WORKING WITH MOVEABLES
zoomLevels = ["Zoom 1","Zoom 2","Zoom 3","Zoom 4","Zoom 5","Zoom 6","Zoom 7","Zoom 8","Zoom 9", "Zoom 10"]

@mxcube.route("/mxcube/api/v0.1/sampleview/zoom", methods=['PUT'])
def moveZoomMotor():
    """
    """
    params = request.data
    params = json.loads(params)
    newPos = params['level']
    zoomMotor = mxcube.diffractometer.getObjectByRole('zoom') 
    try:
        zoomMotor.moveToPosition(int(newPos))
        return Response(status=200)
    except Exception:
        return Response(status=409)

# @mxcube.route("/mxcube/api/v0.1/sampleview/<id>", methods=['PUT'])
# def moveSampleCentringMotor(id):
#     """
#     SampleCentring: move "id" moveable to the position specified in the data:position
#     Moveable can be a motor (kappa, omega, phi), a ligth, light/zoom level.
#     Args: moveable and new position in the body {'newpos': value}
#         id: str
#         value: float
#     Return: '200' if command issued succesfully, otherwise '409'
#     """
#     params = request.data
#     params = json.loads(params)
#     newPos = params['newPos']

#     motor_hwobj = mxcube.diffractometer.getObjectByRole(id.lower())
#     logging.getLogger('HWR').info('[SampleCentring] Movement called for motor: "%s", new position: "%s"' % (id, str(newPos)))
#     logging.getLogger('HWR').info('[SampleCentring] Movement called for motor with motor name: ' + str(motor_hwobj.motor_name))

#     #the following if-s to solve inconsistent movement method
#     try:
#         if motor_hwobj.motor_name.lower() == 'zoom':
#             motor_hwobj.moveToPosition(newPos)
#         elif motor_hwobj.motor_name.lower() == 'backlight':
#             if int(newPos):
#                 motor_hwobj.wagoIn()
#                 mxcube.diffractometer.getObjectByRole('light').move(1)
#             else:
#                 motor_hwobj.wagoOut()
#                 mxcube.diffractometer.getObjectByRole('light').move(0)
#         else:
#             motor_hwobj.move(float(newPos))
#         return Response(status=200)
#     except Exception:
#         logging.getLogger('HWR').exception('[SAMPLEVIEW] could not move motor "%s" to positions "%s" ' % (id, newPos))
#         return Response(status=409)
#     logging.getLogger('HWR').info('[SampleCentring] Movement finished for motor: "%s"' % (motor_hwobj.motor_name))  # str(motor_hwobj.getPosition()))) #zoom motor will fail in getPosition(), perhaps an alias there?

@mxcube.route("/mxcube/api/v0.1/sampleview/<id>", methods=['GET'])
def get_status_of_id(id):
    """
    SampleCentring: get status of element with id:"id"
    Args: moveable 'id' in the url
    Return: {motorname: {'Status': status, 'position': position} } plus status code 200
        motorname: str
        status: str
        position: float
    """
    data = {}
    motor = mxcube.diffractometer.getObjectByRole(id.lower())
    try:
        if motor.motor_name == 'Zoom':
            pos = motor.getCurrentPositionName()
            status = "unknown"
        elif motor.motor_name == 'Light':
            pos = motor.getWagoState()  # {0:"out", 1:"in", True:"in", False:"out"}
            status = motor.getWagoState()
        else:
            pos = motor.get_position()
            status = motor.get_state()
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
    SampleCentring: get generic status, positions of moveables ...
    Args: None
    Return: {   Moveable1:{'Status': status, 'position': position},
                ...,
                MoveableN:{'Status': status, 'position': position}
            } plus status code 200
        status: str
        position: float
        moveables: 'Kappa', 'Omega', 'Phi', 'Zoom', 'Light'

    """
    motors = ['Kappa', 'Omega', 'Phi', 'Zoom', 'Light']  # more are needed

    data = {}
    try:
        for mot in motors:
            motor_hwobj = mxcube.diffractometer.getObjectByRole(mot.lower())
            if mot == 'Zoom':
                pos = motor_hwobj.getCurrentPositionName()
                status = "unknown"
            elif mot == 'Light':
                pos = motor_hwobj.getWagoState()  # {0:"out", 1:"in", True:"in", False:"out"}
                status = motor_hwobj.getWagoState()
            else:
                pos = motor_hwobj.get_position()
                status = motor_hwobj.get_state()
            data[mot] = {'Status': status, 'position': pos}
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could get all motor  status')
        return Response(status=409)

#### WORKING WITH THE SAMPLE CENTRING
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/startauto", methods=['PUT'])
def centreAuto():
    """
    Start automatic (lucid) centring procedure
    Args: None
    Return: '200' if command issued succesfully, otherwise '409'. Note that this does not mean\
        if the centring is succesfull or not
    """
    logging.getLogger('HWR.MX3').info('[Centring] Auto centring method requested')
    try:
        centredPos = mxcube.diffractometer.startAutoCentring()
        if centredPos is not None:
            return Response(status=200)
        else:
            return Response(status=409)
    except Exception:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/start3click", methods=['PUT'])
def centre3click():
    """
    Start 3 click centring procedure
    Args: None
    Return: '200' if command issued succesfully, otherwise '409'. Note that this does not mean\
    if the centring is succesfull or not
    """
    logging.getLogger('HWR.MX3').info('[Centring] 3click method requested')
    try:
        currentCentringProcedure = mxcube.diffractometer.start3ClickCentring()
        return Response(status=200)  # this only means the call was succesfull
    except:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/click", methods=['PUT'])
def aClick():
    """
    The 3-click method need the input from the user, Start centring procedure
    Args: positions of the clicks, {clickPos={"x":'+x+',"y":'+ y+'}}
        x, y: int
    Return: '200' if command issued succesfully, otherwise '409'.
    """
    params = request.data
    params = json.loads(params)
    clickPosition = params['clickPos']
    try:
        mxcube.diffractometer.imageClicked(clickPosition['x'], clickPosition['y'], clickPosition['x'], clickPosition['y'])
        return Response(status=200)
    except Exception:
        return Response(status=409)

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
        mxcube.diffractometer.rejectRentring()
        return Response(status=200)
    except Exception:
        return Response(status=409)
