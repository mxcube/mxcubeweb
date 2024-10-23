from flask import (
    Blueprint,
    jsonify,
    request,
)


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
    def display_image():
        res = app.beamline.display_image(
            request.args.get("path", None),
            request.args.get("img_num", None),
        )

        return jsonify(res)

    return bp
