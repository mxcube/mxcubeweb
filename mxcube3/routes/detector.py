from flask import jsonify

from mxcube3 import server
from mxcube3.core import beamlineutils
from mxcube3 import mxcube


@server.FLASK.route("/mxcube/api/v0.1/detector/", methods=["GET"])
@server.restrict
def get_detector_info():
    """
    Retrieves general info from the detector.
        :response Content-type: application/json, example:
            {'filetype': 'h5'},
        :statuscode: 200: no error
        :statuscode: 409: error
    """

    resp = jsonify({"fileSuffix": beamlineutils.get_detector_info()})
    resp.status_code = 200
    return resp
