from flask import jsonify

from mxcube3 import mxcube
from mxcube3 import server

import logging


@server.FLASK.route("/samplegrid")
@server.FLASK.route("/datacollection")
@server.FLASK.route("/samplechanger")
@server.FLASK.route("/logging")
@server.FLASK.route("/remoteaccess")
@server.restrict
def serve_static_file():
    logging.getLogger("HWR").info("[Main] Serving main page")
    return server.FLASK.send_static_file("index.html")


@server.FLASK.route("/")
@server.FLASK.route("/login")
def unrestricted_serve_static_file():
    logging.getLogger("HWR").info("[Main] Serving main page")
    return server.FLASK.send_static_file("index.html")

@server.FLASK.route("/mxcube/api/v0.1/uiproperties")
@server.restrict
def get_ui_properties():
    return jsonify(mxcube.get_ui_properties())
