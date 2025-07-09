import logging

from flask import (
    Blueprint,
    Response,
    jsonify,
)
from mxcubecore import HardwareRepository as HWR


def init_route(app, server, url_prefix):
    bp = Blueprint("beamline", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def beamline_get_all_attributes():
        return jsonify(app.beamline.beamline_get_all_attributes())

    @bp.route("/beam/info", methods=["GET"])
    @server.restrict
    def get_beam_info():
        """
        Beam information: position, size, shape
        return_data = {"position": , "shape": , "size_x": , "size_y": }
        """
        return jsonify(app.beamline.get_beam_info())

    @bp.route("/datapath", methods=["GET"])
    @server.restrict
    def beamline_get_data_path():
        """
        Retrieve data directory from the session hwobj,
        this is specific for each beamline.
        """
        data = HWR.beamline.session.get_base_image_directory()
        return jsonify({"path": data})

    @bp.route("/prepare_beamline", methods=["PUT"])
    @server.require_control
    @server.restrict
    def prepare_beamline_for_sample():
        """
        Prepare the beamline for a new sample.
        """
        try:
            app.beamline.prepare_beamline_for_sample()
        except Exception:
            msg = "Cannot prepare the Beamline for a new sample"
            logging.getLogger("HWR").exception(msg)
            return Response(status=200)
        return Response(status=200)

    return bp
