import logging
import json

from flask import Blueprint, jsonify, request, make_response
from mxcubeweb import logging_handler


def init_route(app, server, url_prefix):
    bp = Blueprint("log", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def log():
        """
        Retrive log messages
        """
        messages = []

        for handler in logging.getLogger("MX3.HWR").handlers:
            if isinstance(handler, logging_handler.MX3LoggingHandler):
                messages = handler.buffer

        return jsonify(messages)

    @server.restrict
    @bp.route("/log_frontend_traceback", methods=["POST"])
    def log_front_end_traceback():
        """
        Logs a UI traceback to the UI logger
        """
        args = request.get_json()
        logging.getLogger("MX3.UI").error("------ Start of UI trace back ------")
        logging.getLogger("MX3.UI").error("Traceback: %s " % args["stack"])
        logging.getLogger("MX3.UI").error(
            "State: %s " % json.dumps(args["state"], indent=4)
        )
        logging.getLogger("MX3.UI").error("------ End of UI trace back ------")
        return make_response("", 200)

    return bp
