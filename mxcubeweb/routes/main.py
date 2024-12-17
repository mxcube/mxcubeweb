import logging
import time
import traceback
from datetime import datetime

import flask_login
from flask import (
    Blueprint,
    jsonify,
    request,
)
from mxcubecore import HardwareRepository as HWR
from spectree import Response

from mxcubeweb import __version__
from mxcubeweb.core.models.configmodels import UIPropertiesListModel
from mxcubeweb.core.models.generic import AppSettingsModel


def init_route(app, server, url_prefix):
    bp = Blueprint("main", __name__, url_prefix=url_prefix)

    @server.route("/samplegrid")
    @server.route("/datacollection")
    @server.route("/equipment")
    @server.route("/logging")
    @server.route("/remoteaccess")
    @server.route("/help")
    @server.restrict
    def serve_static_file():
        logging.getLogger("HWR").info("[Main] Serving main page")
        return server.flask.send_static_file("index.html")

    @server.route("/")
    @server.route("/login")
    def unrestricted_serve_static_file():
        logging.getLogger("HWR").info("[Main] Serving main page")
        return server.flask.send_static_file("index.html")

    @bp.route("/uiproperties")
    @server.restrict
    @server.validate(resp=Response(HTTP_200=UIPropertiesListModel))
    def get_ui_properties():
        return app.get_ui_properties()

    @bp.route("/application_settings")
    @server.restrict
    @server.validate(resp=Response(HTTP_200=AppSettingsModel))
    def mxcube_mode():
        return jsonify(
            {
                "mode": app.CONFIG.app.mode,
                "version": __version__.__version__,
                "mesh_result_format": HWR.beamline.mesh_result_format,
                "use_native_mesh": HWR.beamline.use_native_mesh,
                "enable_2d_points": HWR.beamline.enable_2d_points,
            }
        )

    @server.flask.login_manager.unauthorized_handler
    def unauth_handler():
        return jsonify(""), 401

    @server.flask.before_request
    def before_request():
        if not flask_login.current_user.is_anonymous:
            flask_login.current_user.last_request_timestamp = datetime.now()
            app.usermanager.update_user(flask_login.current_user)

    @server.flask.errorhandler(Exception)
    def exceptions(e):
        tb = traceback.format_exc()
        timestamp = time.strftime("[%Y-%b-%d %H:%M]")
        logging.getLogger("MX3.HWR").debug(
            "%s %s %s %s %s 501 INTERNAL SERVER ERROR\n%s",
            timestamp,
            request.remote_addr,
            request.method,
            request.scheme,
            request.full_path,
            tb,
        )

        return jsonify({"error": "Server error"}), 501

    return bp
