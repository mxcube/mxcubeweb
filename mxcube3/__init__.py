from __future__ import absolute_import

import cPickle as pickle
import mock
import os
import logging
import sys
import time
import traceback

import gevent

from optparse import OptionParser
from logging import StreamHandler, NullHandler
from logging.handlers import TimedRotatingFileHandler

from flask import Flask, request, session
from flask_socketio import SocketIO
from flask_session import Session



sys.modules["Qub"] = mock.Mock()
sys.modules["Qub.CTools"] = mock.Mock()

# To make "from HardwareRepository import ..." possible
sys.path.insert(0, os.path.dirname(__file__))
from HardwareRepository import HardwareRepository as hwr, removeLoggingHandlers

XML_DIR = os.path.join(os.path.join(os.path.dirname(__file__), os.pardir),
                       "test/HardwareObjectsMockup.xml/")

opt_parser = OptionParser()
opt_parser.add_option("-r", "--repository",
                      dest="hwr_directory",
                      help="Hardware Repository XML files path",
                      default= XML_DIR)
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

def exit_with_error(msg):
    logging.getLogger("HWR").error(traceback.format_exc())

    if msg:
        logging.getLogger("HWR").error(msg)

    msg = "Could not initialize one or several hardware objects, stopped "
    msg += "at first error !"

    logging.getLogger("HWR").error(msg)
    logging.getLogger("HWR").error("Quitting server !")
    sys.exit(-1)


def complete_initialization(app):
    try:
        app.beamline = get_hardware_object(hwr, cmdline_options.beamline_setup)
        app.xml_rpc_server = get_hardware_object(hwr, 'xml-rpc-server')
        app.actions = hwr.getHardwareObject(cmdline_options.beamline_actions)
        app.plotting = hwr.getHardwareObject(cmdline_options.plotting)

        app.session = get_hardware_object(app.beamline, "session")
        app.collect = get_hardware_object(app.beamline, "collect")
        app.workflow = get_hardware_object(app.beamline, "workflow")
        app.shapes = get_hardware_object(app.beamline, "shape_history")
        app.diffractometer = get_hardware_object(app.beamline, "diffractometer")
        app.db_connection =  get_hardware_object(app.beamline, "lims_client")
        app.sample_changer = get_hardware_object(app.beamline, "sample_changer")
        app.sc_maintenance = get_hardware_object(app.beamline, "sample_changer_maintenance")
        app.rest_lims = get_hardware_object(app.beamline, "lims_rest_client")

        Utils.enable_snapshots(app.collect, app.diffractometer)
        init_app_state(app)
        init_sample_video(app)
    except:
        msg = "Could not initialize one or several hardware objects, "
        msg += "stopped at first error ! \n"
        msg += "Make sure that all devices servers are running \n"
        msg += "Make sure that the detector software is running \n"
        exit_with_error(msg)

    try:
        SampleCentring.init_signals()
        SampleChanger.init_signals()
        Beamline.init_signals()
        Diffractometer.init_signals()
    except Exception:
        sys.excepthook(*sys.exc_info())

    INIT_EVENT.set()


def get_hardware_object(obj, name):
    ho = None

    try:
        if hasattr(obj, "getHardwareObject"):
            ho = obj.getHardwareObject(name)
        else:
            ho = obj.getObjectByRole(name)
    except:
        msg = "Could not initialize hardware object corresponding to %s \n"
        msg = msg % name.upper()
        msg += "Make sure that all related device servers are running \n"
        msg += "Make sure that the detector software is running \n"

        exit_with_error(msg)

    return ho


def init_app_state(app):
    from queue_entry import CENTRING_METHOD

    # SampleID of currently mounted sample
    app.CURRENTLY_MOUNTED_SAMPLE = {}
    app.SELECTED_PROPOSAL = None
    app.SELECTED_PROPOSAL_ID = None
    app.SAMPLE_TO_BE_MOUNTED = ''
    app.CENTRING_METHOD = CENTRING_METHOD.LOOP
    app.NODE_ID_TO_LIMS_ID = {}
    app.INITIAL_FILE_LIST = []
    app.SC_CONTENTS = {"FROM_CODE": {}, "FROM_LOCATION": {}}
    app.SAMPLE_LIST = {"sampleList": {}, 'sampleOrder': []}
    app.TEMP_DISABLED = []
    app.USERS = {}
    app.MESSAGES = []
    qutils.init_queue_settings()
    app.ALLOW_REMOTE = cmdline_options.allow_remote
    app.TIMEOUT_GIVES_CONTROL = cmdline_options.ra_timeout

    app.empty_queue = pickle.dumps(hwr.getHardwareObject(cmdline_options.queue_model))
    app.queue = qutils.new_queue()

def init_sample_video(app):
    # set up streaming
    from mxcube3.video import streaming

    try:
        streaming.init(app.diffractometer.camera, cmdline_options.video_device)
    except Exception as ex:
        msg = "Coult not initialize video from %s, error was: " % cmdline_options.video_device
        msg += str(ex)
        logging.getLogger('HWR').info(msg)
        app.VIDEO_DEVICE = None
    else:
        app.VIDEO_DEVICE = cmdline_options.video_device

def init_logging():
    removeLoggingHandlers()

    log_formatter = logging.Formatter('%(asctime)s |%(name)-7s|%(levelname)-7s| %(message)s')
    log_file = cmdline_options.log_file
    if log_file:
        log_file_handler = TimedRotatingFileHandler(log_file, when='midnight', backupCount=10)
        os.chmod(log_file, 0o666)
        log_file_handler.setFormatter(log_formatter)

    # installs logging handler to send messages to clients
    import logging_handler
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(NullHandler())
    custom_log_handler = logging_handler.MX3LoggingHandler()
    custom_log_handler.setLevel(logging.DEBUG)
    custom_log_handler.setFormatter(log_formatter)
    exception_logger = logging.getLogger("exceptions")
    hwr_logger = logging.getLogger("HWR")
    user_logger = logging.getLogger("user_level_log")
    queue_logger = logging.getLogger("queue_exec")
    stdout_log_handler = StreamHandler(sys.stdout)
    stdout_log_handler.setFormatter(log_formatter)
    for logger in (exception_logger, hwr_logger, user_logger, queue_logger):
      logger.addHandler(custom_log_handler)
      logger.addHandler(stdout_log_handler)
      if log_file:
          logger.addHandler(log_file_handler)

def exception_handler(e):
    err_msg = "Uncaught exception while calling %s" % request.path
    logging.getLogger("exceptions").exception(err_msg)
    return err_msg + ": " + traceback.format_exc(), 409


t0 = time.time()

template_dir = os.path.join(os.path.dirname(__file__), "templates")
app = Flask(__name__,  static_url_path='', template_folder=template_dir)
app.debug = False

app.config['SESSION_TYPE'] = "redis"
app.config['SESSION_KEY_PREFIX'] = "mxcube:session:"
app.config['SECRET_KEY'] = "nosecretfornow"
app.register_error_handler(Exception, exception_handler)

sess = Session()
sess.init_app(app)

socketio = SocketIO(manage_session=False)
socketio.init_app(app)

# the following test prevents Flask from initializing twice
# (because of the Reloader)
if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    try:
        hwr_directory = cmdline_options.hwr_directory
        hwr.addHardwareObjectsDirs([os.path.join(os.path.dirname(__file__), 'HardwareObjects')])
        hwr = hwr.HardwareRepository(os.path.abspath(os.path.expanduser(hwr_directory)))
        hwr.connect()
    except:
        print(traceback.format_exc())


    init_logging()

    from routes import loginutils

    # Make the valid_login_only decorator available on app object
    app.restrict = loginutils.valid_login_only

    # Importing all REST-routes
    from routes import (Main, Login, Beamline, Mockups, Utils,
                        SampleCentring, SampleChanger, Diffractometer, Queue,
                        lims, qutils, workflow, Detector, ra)

    # Install server-side UI state storage
    from mxcube3 import state_storage

    gevent.spawn(complete_initialization, app)
    INIT_EVENT.wait()
    logging.getLogger("HWR").info("MXCuBE 3 initialized, it took %.1f seconds" % (time.time() - t0))
