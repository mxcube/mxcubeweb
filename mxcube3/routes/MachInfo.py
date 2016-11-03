import time
import logging

from flask import Response, jsonify, request, session
from mxcube3 import app as mxcube
from mxcube3 import socketio

ROLE = "machinfo"

def init(beamline_hwo):
    machinfo_hwo = beamline_hwo.getObjectByRole(ROLE)
    machinfo_hwo.connect(machinfo_hwo, 'machInfoChanged',
                           mach_info_changed)

def mach_info_changed(values):
    logging.getLogger('HWR').info('[MACHINFO] values changed %s' % str(values))
    socketio.emit("mach_info_changed", values, namespace="/hwr")

@mxcube.route("/mxcube/api/v0.1/machinfo/", methods=['GET'])
def mach_info_get():
    """
    Start execution of the queue.

    :returns: Respons object, status code set to:
              200: On success
              409: Queue could not be started
    """
    try:
        values = mxcube.machinfo.get_values(False)
        logging.getLogger('HWR').info('[MACHINFO] Got values ' % str(values))
        resp = jsonify({'values': values})
        resp.status_code = 200
    except Exception as ex:
        logging.getLogger('HWR').info('[MACHINFO] Cannot read values ')
        resp = Response()
        resp.status_code = 409
    
    return resp


