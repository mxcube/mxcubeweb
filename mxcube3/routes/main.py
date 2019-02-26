from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from mxcube3 import server

import logging


@server.route("/samplegrid")
@server.route("/datacollection")
@server.route("/samplechanger")
@server.route("/logging")
@server.route("/remoteaccess")
@server.restrict
def serve_static_file():
    logging.getLogger("HWR").info("[Main] Serving main page")
    return server.send_static_file("index.html")


@server.route("/")
@server.route("/login")
def unrestricted_serve_static_file():
    logging.getLogger("HWR").info("[Main] Serving main page")
    return server.send_static_file("index.html")
