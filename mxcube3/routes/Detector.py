from flask import jsonify
from mxcube3 import app as mxcube

import logging

@mxcube.route("/mxcube/api/v0.1/detector", methods=['GET'])
@mxcube.restrict
def get_detector_info():
    """
    Retrieves general info from the detector.
        :response Content-type: application/json, example:
            {'filetype': 'h5'},
        :statuscode: 200: no error
        :statuscode: 409: error
    """
    filetype = mxcube.beamline.detector_hwobj.getProperty('file_suffix')
    if filetype is None:
        filetype = 'cbf'
        logging.getLogger('HWR').warning('Detector file format not specified. Setting as cbf.')

    resp = jsonify({'fileSuffix': filetype})
    resp.status_code = 200
    return resp
