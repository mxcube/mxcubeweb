import logging

from flask import (
    Blueprint,
    Response,
    jsonify,
    make_response,
    request,
)
from markupsafe import escape
from mxcubecore import HardwareRepository as HWR


def init_route(app, server, url_prefix):
    bp = Blueprint("beamline", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def beamline_get_all_attributes():
        return jsonify(app.beamline.beamline_get_all_attributes())

    @bp.route("/<name>/abort", methods=["GET"])
    @server.require_control
    @server.restrict
    def beamline_abort_action(name):
        """
        Aborts an action in progress.

        :param str name: Owner / Actuator of the process/action to abort

        Replies with status code 200 on success and 500 on exceptions.
        """
        try:
            app.beamline.beamline_abort_action(name)
        except Exception:
            logging.getLogger("MX3.HWR").exception("Could not abort %s", name)
            return make_response(f"Could not abort {escape(name)}", 500)
        else:
            logging.getLogger("user_level_log").error("%s, aborted" % name)
            return make_response("{}", 200)

    @bp.route("/<name>/run", methods=["POST"])
    @server.require_control
    @server.restrict
    def beamline_run_action(name):
        """
        Starts a beamline action; POST payload is a json-encoded object with
        'parameters' as a list of parameters

        :param str name: action to run

        Replies with status code 200 on success and 500 on exceptions.
        """
        try:
            params = request.get_json()["parameters"]
        except Exception:
            params = []

        try:
            app.beamline.beamline_run_action(name, params)
        except Exception:
            logging.getLogger("MX3.HWR").exception("Cannot run action %s", name)
            return make_response(f"Cannot run action {escape(name)}", 500)
        else:
            return make_response("{}", 200)

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
