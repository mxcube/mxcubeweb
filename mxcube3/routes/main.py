import logging

from flask import Blueprint, jsonify, session
from spectree import Response
from flask_login import current_user

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

    @server.flask.before_request
    def before_request():
        pass
        # if not current_user.is_anonymous:
        #     now = datetime.datetime.now()
        #     last_active = current_user.disconnect_timestamp
        #     last_active = last_active if last_active else now

        #     current_user.disconnect_timestamp = now
        #     app.usermanager.update_user(current_user)

        #     delta = now - last_active
        #     if delta.seconds > 60:
        #         print('Your session has expired after 1 minute(s), you have been logged out')
        #         app.usermanager.signout()

        #     print(current_user.disconnect_timestamp)

    return bp
