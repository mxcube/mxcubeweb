from flask import Blueprint, jsonify
from mxcube3.core.models.generic import PathModel, Response


def init_route(app, server, url_prefix):
    bp = Blueprint("detector", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def get_detector_info():
        """
        Retrieves general info from the detector.
            :response Content-type: application/json, example:
                {'filetype': 'h5'},
            :statuscode: 200: no error
            :statuscode: 409: error
        """

        resp = jsonify({"fileSuffix": app.beamline.get_detector_info()})
        resp.status_code = 200
        return resp

    @bp.route("/display_image/", methods=["GET"])
    @server.restrict
    @server.validate(resp=Response(HTTP_200=""))
    def display_image(query: PathModel):
        return ""

    return bp
