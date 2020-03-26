from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from gevent import monkey
monkey.patch_all(thread=False)

import mock
import os
import logging
import sys
import time
import traceback


import gevent

from optparse import OptionParser

from flask import Flask, request
from flask_socketio import SocketIO
from flask_session import Session
from flask_restx import Api, Resource, fields

# To make "from HardwareRepository import ..." possible
fname = os.path.dirname(__file__)
sys.path.insert(0, fname)

from HardwareRepository import HardwareRepository as hwr
hwr.addHardwareObjectsDirs([os.path.join(fname, 'HardwareObjects')])

import app as mxcube

sys.modules["Qub"] = mock.Mock()
sys.modules["Qub.CTools"] = mock.Mock()

XML_DIR = os.path.join(os.path.join(os.path.dirname(__file__), os.pardir),
                       "test/HardwareObjectsMockup.xml/")

opt_parser = OptionParser()

opt_parser.add_option("-r", "--repository",
                      dest="hwr_directory",
                      help="Hardware Repository XML files path",
                      default=XML_DIR)

opt_parser.add_option("-l", "--log-file",
                      dest="log_file",
                      help="Hardware Repository log file name",
                      default='')

opt_parser.add_option("-v", "--video-device",
                      dest="video_device",
                      help="Video device, defaults to: No device",
                      default='')

opt_parser.add_option("-w", "--ra",
                      action="store_true",
                      dest="allow_remote",
                      help="Enable remote access",
                      default=False)

opt_parser.add_option("-t", "--ra-timeout",
                      action="store_true",
                      dest="ra_timeout",
                      help="Timeout gives control",
                      default=False)

cmdline_options, args = opt_parser.parse_args()

INIT_EVENT = gevent.event.Event()


def exception_handler(e):
    err_msg = "Uncaught exception while calling %s" % request.path
    logging.getLogger("exceptions").exception(err_msg)
    return err_msg + ": " + traceback.format_exc(), 409


t0 = time.time()

template_dir = os.path.join(os.path.dirname(__file__), "templates")
server = Flask(__name__,  static_url_path='', template_folder=template_dir)

api = Api(server, version='1.0', title='MXCuBE3 API',
    description='MXCuBE3 API',
)

ns = api.namespace('data-publisher', description='MXCuBE3 operations')

server.debug = False
server.config['SESSION_TYPE'] = "redis"
server.config['SESSION_KEY_PREFIX'] = "mxcube:session:"
server.config['SECRET_KEY'] = "nosecretfornow"
server.register_error_handler(Exception, exception_handler)

_session = Session()
_session.init_app(server)

socketio = SocketIO(manage_session=False)
socketio.init_app(server)

# the following test prevents Flask from initializing twice
# (because of the Reloader)

if not server.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    from core import loginutils

    # Make the valid_login_only decorator available on server object
    server.restrict = loginutils.valid_login_only
    server.require_control = loginutils.require_control
    server.ws_restrict = loginutils.ws_valid_login_only

    mxcube.init(hwr, cmdline_options.hwr_directory,
                cmdline_options.allow_remote,
                cmdline_options.ra_timeout,
                cmdline_options.video_device,
                cmdline_options.log_file)

    # Install server-side UI state storage
    mxcube.init_state_storage()

    # Importing REST-routes
    from routes import (main, login, beamline, mockups, samplecentring,
                        samplechanger, diffractometer, queue, lims, workflow,
                        detector, ra)
    
    from routes.data_publisher import ns as ns1

    api.add_namespace(ns1)

    msg = "MXCuBE 3 initialized, it took %.1f seconds" % (time.time() - t0)
    logging.getLogger("HWR").info(msg)
