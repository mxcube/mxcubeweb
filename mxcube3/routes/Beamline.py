from flask import request
from mxcube3 import app as mxcube


# ##----BEAMLINE----##

@mxcube.route("/mxcube/api/v0.1/beamline/<id>/move", methods=['PUT'])
def moveBlMotor(id):
    """Beamline: move "id" moveable (energy, resolution ...) to the position specified
    data = {generic_data, "moveable": id, "position": pos}
    return_data={"result": True/False}
    """
    new_pos = request.args.get('newpos', '')
    motor = mxcube.beamline.getObjectByRole(id.lower())
    motor.move
    return mxcube.beamline.move(data)


@mxcube.route("/mxcube/api/v0.1/beamline/status", methods=['GET'])
def get_bl_status(id):
    """Beamline: get beamline generic status (energy, resolution ...)
    data = {generic_data}
    return_data = { generic_data, {"moveable1":position}, ..., {"moveableN":position} , xxxx }
    """  
    motors = ['Energy', 'Resolution', 'Transmission']  # more are needed

    data = {}
    for mot in motors:
        motor_hwobj = mxcube.beamline.getObjectByRole(mot.lower())
        data[mot] = {'Status': motor_hwobj.get_state(), 'position': motor_hwobj.getPosition()}    

    return data


@mxcube.route("/mxcube/api/v0.1/beamline/<id>/status", methods=['GET'])
def get_bl_id_status(id):
    """Beamline: get beamline status of id:"id"
    data = {generic_data, "Moveable":id}
    return_data = {"Moveable": id, "Status": status}
    """ 
    data = {}
    motor_hwobj = mxcube.beamline.getObjectByRole(id.lower())    
    data[id] = {'Status': motor_hwobj.get_state(), 'position': motor_hwobj.getPosition()}
    return data
