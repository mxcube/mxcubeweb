import logging

from flask import Blueprint, jsonify
from spectree import Response

from mxcube3 import version
from mxcube3.core.models.generic import VersionModel
from mxcube3.core.models.configmodels import ModeEnumModel, UIPropertiesListModel


def init_route(app, server, url_prefix):
    bp = Blueprint("main", __name__, url_prefix=url_prefix)

    @server.route("/samplegrid")
    @server.route("/datacollection")
    @server.route("/samplechanger")
    @server.route("/logging")
    @server.route("/remoteaccess")
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
    @server.validate(
        resp=Response(HTTP_200=UIPropertiesListModel)
    )
    def get_ui_properties():
        return app.get_ui_properties()

    @bp.route("/version")
    @server.restrict
    @server.validate(
        resp=Response(HTTP_200=VersionModel)
    )
    def mxcube_version():
        return jsonify({"version": version.__version__})

    @bp.route("/mode")
    @server.restrict
    @server.validate(
        resp=Response(HTTP_200=ModeEnumModel)
    )
    def mxcube_mode():
        return jsonify({"mode": app.CONFIG.app.mode})

    return bp
