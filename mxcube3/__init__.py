from __future__ import absolute_import

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


# To make "from HardwareRepository import ..." possible
fname = os.path.dirname(__file__)
sys.path.insert(0, fname)

from HardwareRepository import HardwareRepository as hwr
hwr.addHardwareObjectsDirs([os.path.join(fname, 'HardwareObjects')])

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
opt_parser.add_option("-s", "--beamline-setup",
                      dest="beamline_setup",
                      help="Beamline setup HWR file, defaults to /beamline-setup",
                      default='/beamline-setup')
opt_parser.add_option("-q", "--queue-model",
                      dest="queue_model",
                      help="Queue model HWR file, defaults to /queue-model",
                      default='/queue-model')
opt_parser.add_option("-a", "--beamline-actions",
                      dest="beamline_actions",
                      help="Beamline actions (commands) HWR file, defaults to /beamcmds",
                      default='/beamcmds')
opt_parser.add_option("-v", "--video-device",
                      dest="video_device",
                      help="Video device, defaults to /dev/video0",
                      default='/dev/video0')
opt_parser.add_option("-p", "--plotting",
                      dest="plotting",
                      help="Plotting HWR file, defaults to /plotting",
                      default='/plotting')

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


def complete_initialization(server):
    mxcube.init(cmdline_options)
    INIT_EVENT.set()


def exception_handler(e):
    err_msg = "Uncaught exception while calling %s" % request.path
    logging.getLogger("exceptions").exception(err_msg)
    return err_msg + ": " + traceback.format_exc(), 409


t0 = time.time()

template_dir = os.path.join(os.path.dirname(__file__), "templates")
server = Flask(__name__,  static_url_path='', template_folder=template_dir)
server.debug = False

server.config['SESSION_TYPE'] = "redis"
server.config['SESSION_KEY_PREFIX'] = "mxcube:session:"
server.config['SECRET_KEY'] = "nosecretfornow"
server.register_error_handler(Exception, exception_handler)

sess = Session()
sess.init_app(server)

socketio = SocketIO(manage_session=False)
socketio.init_app(server)

# the following test prevents Flask from initializing twice
# (because of the Reloader)
if not server.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    import app as mxcube

    mxcube.init_logging(cmdline_options.log_file)
    mxcube.blcontrol.init(hwr, cmdline_options.hwr_directory)

    from core import loginutils

    # Make the valid_login_only decorator available on server object
    server.restrict = loginutils.valid_login_only
    # Install server-side UI state storage
    mxcube.init_state_storage()

    # Importing REST-routes
    from routes import (main, login, beamline, mockups,
                        samplecentring, samplechanger, diffractometer, queue,
                        lims, workflow, detector, ra)

    gevent.spawn(complete_initialization, server)

    INIT_EVENT.wait()

    msg = "MXCuBE 3 initialized, it took %.1f seconds" % (time.time() - t0)
    logging.getLogger("HWR").info(msg)
