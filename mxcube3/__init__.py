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

from mxcube3.config import Config
from mxcube3.app import MXCUBEApplication
from mxcube3.server import Server

sys.modules["Qub"] = mock.Mock()
sys.modules["Qub.CTools"] = mock.Mock()

mxcube = MXCUBEApplication()
server = Server()

def parse_args():
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

    return opt_parser.parse_args()

def main():
    cmdline_options, args = parse_args()

    cfg = Config(os.path.abspath(os.path.join(
        cmdline_options.hwr_directory, 
        "mxcube-server-config.yml"
    )))

    server.init(
        cmdline_options, cfg, mxcube
    )

    mxcube.init(
        server,
        cmdline_options.hwr_directory,
        cmdline_options.allow_remote,
        cmdline_options.ra_timeout,
        cmdline_options.video_device,
        cmdline_options.log_file,
        cfg
    )

    server.register_routes(mxcube)

    server.run()

if __name__ == "__main__":
    main()
