from flask import session, redirect, url_for, render_template, request, Response, stream_with_context
from mxcube3 import app as mxcube
import time, logging, collections
import gevent.event
import os, json
import signals

SAMPLE_IMAGE = None

for signal in signals.MaxLabMicrodiff_signals:
    mxcube.diffractometer.connect(mxcube.diffractometer,signal, signals.signalCallback4)

def new_sample_video_frame_received(img, width, height, *args, **kwargs):
    camera_hwobj = mxcube.diffractometer.getObjectByRole("camera")
    global SAMPLE_IMAGE
    SAMPLE_IMAGE = img
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

@mxcube.route("/mxcube/api/v0.1/sampleview/camera/subscribe", methods=['PUT'])
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

###----SAMPLE CENTRING----###
clicks = collections.deque(maxlen=3)

centred_pos=[]
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
        for cpos in centred_pos:
            if cpos[cpos.keys()[1]] == id:
                resp = jsonify(cpos)#{'QueueId': nodeId} )
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved, not found')
        return Response(status = 409)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved')
        return Response(status = 409)
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['POST'])
def saveCentringWithId(id):
    """
    Store the current centring position in the server, there is not limit on how many positions can be stored
    Args: id, for consistency but not used
    Return: new centring position name (pos1, pos2...) plus motors' positions if the current centring position is retrieved and stored succesfully, otherwise '409' error code. In any case: str
    """
    centredPosId = 'pos'+str(len(centred_pos)+1)
    #if request.args.get('rename',''): renaming option comes later
    try:
        mxcube.diffractometer.saveCurrentPos()
        motorPositions = mxcube.diffractometer.centringStatus["motors"]
        #motorPositions = {'focus': 0.69518381761112, 'kappa': 0.0009, 'kappa_phi': 311.0, 'phi': 0.34759190880556, 'phiy': 1.04277572641668, 'phiz': 1.39036763522224, 'sampx': 1.379595440278002, 'sampy': 2.08555145283336, 'zoom': 8.53}
        data = {'name':centredPosId, 'motorPositions': motorPositions}
        #or
        #motorPositions = mxcube.diffractometer.getPositions()
        centred_pos.append(data)
        logging.getLogger('HWR.MX3').info('[Centring] Centring Positions saved:'+str(data)) 
        resp = jsonify(data)#{'QueueId': nodeId} )
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be saved')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['PUT'])
def updateCentringWithId(id):
    """SampleCentring: update centred position of point with id:"id", now only expected to be used for **renaming**
    data = {generic_data, "name": newName}
    return_data= updated entry plus error code 200/409
    """
    params = request.data#get_json()
    params = json.loads(params)
    try:
        for cpos in centred_pos:
            if cpos[cpos.keys()[1]] == id:
                cpos.update(params)
                resp = jsonify(cpos)#{'QueueId': nodeId} )
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be retrieved, not found')
        return Response(status = 409)    
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be updated')
        return Response(status = 409)
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>", methods=['DELETE'])
def deleteCentringWithId(id):
    """SampleCentring: set centring point position of point with id:"id", id=1,2,3...
    data = {generic_data, "point": id, "position": {x,y}}
    return_data= removed entry plus error code 200/409
    """
    try:
        for cpos in centred_pos:
            if cpos.get('name') == id:
                centred_pos.remove(cpos)
                resp = jsonify(cpos)#{'QueueId': nodeId} )
                resp.status_code = 200
                return resp
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be deleted, not found')
        return Response(status = 409)    
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] centring position could not be deleted')
        return Response(status = 409)

@mxcube.route("/mxcube/api/v0.1/sampleview/centring/<id>/moveto", methods=['PUT'])
def moveToCentredPosition(id):
    """
    Move all the motors involved in the centring to the given centring position
    Args: position, the name of the centring position (pos1, pos2, customName1,...)
        position: str
    Return: '200' if command issued succesfully, otherwise '409'.
    """
    motorPositions = [d['motorPositions'] for d in centred_pos if d.get('name') == id]
    #or moveMotors(self, roles_positions_dict)???
    try:
        mxcube.diffractometer.moveToCentredPosition(motorPositions)
        logging.getLogger('HWR.MX3').info('[Centring] moved to Centring Position')  
        return Response(status = 200)    
    except Exception:
        logging.getLogger('HWR.MX3').info('[Centring] could not move to Centring Position')  
        return Response(status = 409)    


#### WORKING WITH MOVEABLES
@mxcube.route("/mxcube/api/v0.1/sampleview/<id>", methods=['PUT'])
def moveSampleCentringMotor(id):
    """
    SampleCentring: move "id" moveable to the position specified in the data:position
    Moveable can be a motor (kappa, omega, phi), a ligth, light/zoom level.
    Args: moveable and new position in the body {'newpos': value}
        id: str
        value: float
    Return: '200' if command issued succesfully, otherwise '409'
    """
    params = request.data#get_json()
    params = json.loads(params)
    newPos = params['newPos']

    motor_hwobj = mxcube.diffractometer.getObjectByRole(id.lower())
    logging.getLogger('HWR').info('[SampleCentring] Movement called for motor: "%s", new position: "%s"' %(id, str(newPos)))
    logging.getLogger('HWR').info('[SampleCentring] Movement called for motor with motor name: '+str(motor_hwobj.motor_name))

    #the following if-s to solve inconsistent movement method
    try:
        if motor_hwobj.motor_name.lower() == 'zoom':
            motor_hwobj.moveToPosition(newPos)
        elif motor_hwobj.motor_name.lower() == 'backlight':
            if int(newPos):
                motor_hwobj.wagoIn()
                mxcube.diffractometer.getObjectByRole('light').move(1)
            else: 
                motor_hwobj.wagoOut()
                mxcube.diffractometer.getObjectByRole('light').move(0)
        else: 
            motor_hwobj.move(float(newPos))
        return Response(status = 200)
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could not move motor "%s" to positions "%s" ' %(id, newPos))
        return Response(status = 409)    
    logging.getLogger('HWR').info('[SampleCentring] Movement finished for motor: "%s"' %(motor_hwobj.motor_name))#, str(motor_hwobj.getPosition()))) #zoom motor will fail in getPosition(), perhaps an alias there?
    
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
            pos = motor.getWagoState() # {0:"out", 1:"in", True:"in", False:"out"}
            status = motor.getWagoState()
        else: 
            pos = motor.get_position()
            status = motor.get_state()
        
        data[motor.motor_name] = {'Status': status, 'position': pos}
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        logging.getLogger('HWR').exception('[SAMPLEVIEW] could get motor "%s" status ' %id)
        return Response(status = 409)    
   

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
    motors = ['Kappa', 'Omega', 'Phi', 'Zoom', 'Light'] #more are needed

    data = {}
    try:
        for mot in motors:
            motor_hwobj = mxcube.diffractometer.getObjectByRole(mot.lower())
            if mot == 'Zoom':
                pos = motor_hwobj.getCurrentPositionName()
                status = "unknown" 
            elif mot == 'Light':
                pos = motor_hwobj.getWagoState() # {0:"out", 1:"in", True:"in", False:"out"}
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
        return Response(status = 409)    
   
#### WORKING WITH THE SAMPLE CENTRING
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/startauto", methods=['PUT'])
def centreAuto():
    """
    Start automatic (lucid) centring procedure
    Args: None
    Return: '200' if command issued succesfully, otherwise '409'. Note that this does not mean\
    if the centring is succesfull or not
    """
    mxcube.diffractometer.emit('minidiffReady','sadfasfadf')
    # mxcube.resolution.emit("deviceReady", 'some data')
    try:
        centred_pos = mxcube.diffractometer.startAutoCentring()
        if centred_pos is not None:
            return Response(status = 200)
        else:
            return Response(status = 409)
    except Exception:
        return Response(status = 409)

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
        return Response(status = 200) #this only means the call was succesfull
    except:
        return Response(status = 409)
@mxcube.route("/mxcube/api/v0.1/sampleview/centring/click", methods=['PUT'])
def aClick():
    """
    The 3-click method need the input from the user, Start centring procedure
    Args: positions of the clicks, {clickPos={"x":'+x+',"y":'+ y+'}}
        x, y: int
    Return: '200' if command issued succesfully, otherwise '409'.
    """
    params = request.data#get_json()
    params = json.loads(params)
    clickPosition = params['clickPos']
    try:
        mxcube.diffractometer.imageClicked(clickPosition['x'], clickPosition['y'], clickPosition['x'], clickPosition['y'])
        Response(status = 200)
    except Exception:
        Response(status = 409)

