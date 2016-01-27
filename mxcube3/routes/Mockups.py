from mxcube3 import app as mxcube
import logging


@mxcube.route("/mxcube/api/v0.1/mockups/isready", methods=['GET'])
def mockup_ready():
    logging.getLogger('HWR').info('[Routes] Called mockup ready')
    print mxcube.resolution.getPosition()
    return str(mxcube.resolution.isReady())


@mxcube.route("/mxcube/api/v0.1/mockups/newres/<int:newres>", methods=['PUT'])
def mockup_newres():
    logging.getLogger('HWR').info('[Routes] Called mockup setting new resolution')
    return mxcube.mockups.setResolution(newres)
