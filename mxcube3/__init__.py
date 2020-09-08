from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

from gevent import monkey

monkey.patch_all(thread=False)

import mock
import os
import signal
import logging
import sys
import time
import traceback
import atexit

import gevent

from optparse import OptionParser

from flask import Flask, request, session
from flask_socketio import SocketIO
from flask_session import Session

# To make "from HardwareRepository import ..." possible
fname = os.path.dirname(__file__)
sys.path.insert(0, fname)

from HardwareRepository import HardwareRepository as hwr

hwr.addHardwareObjectsDirs([os.path.join(fname, "HardwareObjects")])

import app as mxcube
from config import Config

sys.modules["Qub"] = mock.Mock()
sys.modules["Qub.CTools"] = mock.Mock()

XML_DIR = os.path.join(
    os.path.join(os.path.dirname(__file__), os.pardir),
    "test/HardwareObjectsMockup.xml/",
)

opt_parser = OptionParser()

opt_parser.add_option(
    "-r",
    "--repository",
    dest="hwr_directory",
    help="Hardware Repository XML files path",
    default=XML_DIR,
)


opt_parser.add_option(
    "-c",
    "--config-file",
    dest="config_file",
    help="Server configuration file",
    default="",
)

opt_parser.add_option(
    "-l",
    "--log-file",
    dest="log_file",
    help="Hardware Repository log file name",
    default="",
)

opt_parser.add_option(
    "-v",
    "--video-device",
    dest="video_device",
    help="Video device, defaults to: No device",
    default="",
)

opt_parser.add_option(
    "-w",
    "--ra",
    action="store_true",
    dest="allow_remote",
    help="Enable remote access",
    default=False,
)

opt_parser.add_option(
    "-t",
    "--ra-timeout",
    action="store_true",
    dest="ra_timeout",
    help="Timeout gives control",
    default=False,
)

cmdline_options, args = opt_parser.parse_args()

INIT_EVENT = gevent.event.Event()


def exception_handler(e):
    err_msg = "Uncaught exception while calling %s" % request.path
    logging.getLogger("exceptions").exception(err_msg)
    return err_msg + ": " + traceback.format_exc(), 409


def kill_processes():
    pid_list = []

    with open("/tmp/mxcube.pid", "r") as f:
        pid_list = f.read().strip()
        pid_list = pid_list.split(" ")
        pid_list.reverse()

    with open("/tmp/mxcube.pid", "w") as f:
        f.write("")

    for pid in pid_list:
        os.kill(int(pid), signal.SIGKILL)


t0 = time.time()

template_dir = os.path.join(os.path.dirname(__file__), "templates")
server = Flask(__name__, static_url_path="", template_folder=template_dir)

cfg = Config(cmdline_options.config_file)

server.config.from_object(cfg)
server.register_error_handler(Exception, exception_handler)

_session = Session()
_session.init_app(server)

socketio = SocketIO(manage_session=False, cors_allowed_origins=cfg.ALLOWED_CORS_ORIGINS)
socketio.init_app(server)

# the following test prevents Flask from initializing twice
# (because of the Reloader)

if not server.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    atexit.register(kill_processes)

    with open("/tmp/mxcube.pid", "w") as f:
        f.write(str(os.getpid()) + " ")

    from core import loginutils

    # Make the valid_login_only decorator available on server object
    server.restrict = loginutils.valid_login_only
    server.require_control = loginutils.require_control
    server.ws_restrict = loginutils.ws_valid_login_only

    mxcube.init(
        hwr,
        cmdline_options.hwr_directory,
        cmdline_options.allow_remote,
        cmdline_options.ra_timeout,
        cmdline_options.video_device,
        cmdline_options.log_file,
    )

    # Install server-side UI state storage
    mxcube.init_state_storage()

    # Importing REST-routes
    from routes import (
        main,
        login,
        beamline,
        mockups,
        samplecentring,
        samplechanger,
        diffractometer,
        queue,
        lims,
        workflow,
        detector,
        ra,
        log
    )

    msg = "MXCuBE 3 initialized, it took %.1f seconds" % (time.time() - t0)
    logging.getLogger("MX3.HWR").info(msg)
