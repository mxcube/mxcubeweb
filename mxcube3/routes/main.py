import logging
import traceback
import time
import flask_login

from datetime import datetime

from flask import Blueprint, jsonify, request
from spectree import Response

from mxcube3 import version
from mxcube3.core.models.generic import VersionModel
from mxcube3.core.models.configmodels import ModeEnumModel, UIPropertiesListModel


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
    @server.validate(resp=Response(HTTP_200=ModeEnumModel))
    def mxcube_mode():
        return jsonify({"mode": app.CONFIG.app.mode, "version": version.__version__})

    @server.flask.before_request
    def before_request():
        # logging.getLogger("MX3.HWR").debug('Remote Addr: %s', request.remote_addr)
        # logging.getLogger("MX3.HWR").debug('Path: %s', request.full_path)
        # logging.getLogger("MX3.HWR").debug('scheme: %s', request.scheme)
        # logging.getLogger("MX3.HWR").debug('Headers: %s', request.headers)

        if not flask_login.current_user.is_anonymous:
            flask_login.current_user.last_request_timestamp = datetime.now()
            app.usermanager.update_user(flask_login.current_user)

    @server.flask.errorhandler(Exception)
    def exceptions(e):
        tb = traceback.format_exc()
        timestamp = time.strftime('[%Y-%b-%d %H:%M]')
        logging.getLogger("MX3.HWR").debug(
            '%s %s %s %s %s 5xx INTERNAL SERVER ERROR\n%s',
            timestamp,
            request.remote_addr,
            request.method,
            request.scheme,
            request.full_path,
            tb
        )

        return tb

    return bp
