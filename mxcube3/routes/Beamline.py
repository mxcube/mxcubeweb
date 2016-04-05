from flask import request, Response, jsonify
from mxcube3 import app as mxcube

import logging

@mxcube.route("/mxcube/api/v0.1/beamline/<id>/move", methods=['PUT'])
def moveBlMotor(id):
    """Beamline: move "id" moveable (energy, resolution ...) to the position specified
    data = {generic_data, "moveable": id, "position": pos}
    return_data={"result": True/False}
    """
    new_pos = request.args.get('newpos','')
    motor = mxcube.beamline.getObjectByRole(id.lower())
    motor.move
    return mxcube.beamline.move(data)


@mxcube.route("/mxcube/api/v0.1/beamline/status", methods=['GET'])
def get_bl_status(id):
    """Beamline: get beamline generic status (energy, resolution ...)
    data = {generic_data}
    return_data = { generic_data, {"moveable1":position}, ..., {"moveableN":position} , xxxx }
    """  
    motors = ['Energy', 'Resolution', 'Transmission'] #more are needed

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

@mxcube.route("/mxcube/api/v0.1/beamline/beamInfo", methods=['GET'])
def getBeamInfo():
    """Beam information: position,size,shape
    return_data={"position":,"shape":,"size_x":,"size_y":}     
    """
    try:
        beamInfo = mxcube.beamline.getObjectByRole("beam_info")
        if beamInfo is None:
             logging.getLogger('HWR').error("beamInfo is not defined")
             return Response(status=409)
        beamInfoDict = beamInfo.get_beam_info()
        print beamInfoDict
        data = {'position': beamInfo.get_beam_position(), \
                'shape': beamInfoDict["shape"], \
                'size_x': beamInfoDict["size_x"], \
                'size_y': beamInfoDict["size_y"], \
               }       
        resp = jsonify(data)
        resp.status_code = 200
        return resp
    except Exception:
        return Response(status=409)

@mxcube.route("/mxcube/api/v0.1/beamline/info", methods=['GET'])
def bl_info():  
    data = {"energy": {"name": "energy",
                       "value": 10,
                       "limits": (0, 1000, 0.1)},
            "transmission": {"name": "transmission",
                             "value": 100,
                             "limits": (0, 1000, 0.1)},
            "resolution": {"name": "resolution",
                           "value": 2,
                           "limits": (0, 1000, 0.1)}}

    return jsonify(data)


@mxcube.route("/mxcube/api/v0.1/beamline/<name>/set", methods=['GET'])
def set_beamline_attribute(name):
    value = request.args.get("value",'')
    print("/mxcube/api/v0.1/beamline/%s/set?value=%s" % (name, value))
    data = {"name": name, "value":value}
    return jsonify(data)


@mxcube.route("/mxcube/api/v0.1/beamline/<name>", methods=['GET'])
def get_beamline_attribute(name):
    value = 2
    print("/mxcube/api/v0.1/beamline/%s/" % (name))
    data = {"name": name, "value":value}
    return jsonify(data)
