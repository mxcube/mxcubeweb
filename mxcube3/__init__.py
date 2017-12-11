from __future__ import absolute_import
from flask import Flask, request, session
from flask_socketio import SocketIO
from flask_session import Session
from optparse import OptionParser

import os
import sys
import logging
import time
from logging import StreamHandler, NullHandler
from logging.handlers import TimedRotatingFileHandler
import cPickle as pickle
import gevent
import traceback
import mock

sys.modules["Qub"] = mock.Mock()
sys.modules["Qub.CTools"] = mock.Mock()
sys.modules["ShapeHistory"] = mock.MagicMock()

opt_parser = OptionParser()
opt_parser.add_option("-r", "--repository",
                      dest="hwr_directory",
                      help="Hardware Repository XML files path",
                      default=os.path.join(os.path.join(os.path.dirname(__file__), os.pardir), 'test/HardwareObjectsMockup.xml/'))
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


cmdline_options, args = opt_parser.parse_args()

t0 = time.time()

app = Flask(__name__, static_url_path='')
app.config['SESSION_TYPE'] = "redis"
app.config['SESSION_KEY_PREFIX'] = "mxcube:session:"
app.config['SECRET_KEY'] = "nosecretfornow"
def exception_handler(e):
    err_msg = "Uncaught exception while calling %s" % request.path
    logging.getLogger("exceptions").exception(err_msg)
    return err_msg+": "+traceback.format_exc(), 409
app.register_error_handler(Exception, exception_handler)
sess = Session()
sess.init_app(app)
app.debug = False

socketio = SocketIO(manage_session=False)
socketio.init_app(app)

# the following test prevents Flask from initializing twice
# (because of the Reloader)
if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    ###Initialization of the HardwareObjects
    # this is to allow Hardware Objects to do
    # 'from HardwareRepository import ...'
    sys.path.insert(0, os.path.dirname(__file__))
    from HardwareRepository import HardwareRepository as hwr, removeLoggingHandlers
    removeLoggingHandlers()
    hwr.addHardwareObjectsDirs([os.path.join(os.path.dirname(__file__), 'HardwareObjects')])

    hwr_directory = cmdline_options.hwr_directory
    hwr = hwr.HardwareRepository(os.path.abspath(os.path.expanduser(hwr_directory)))
    hwr.connect()

    log_formatter = logging.Formatter('%(asctime)s |%(name)-7s|%(levelname)-7s| %(message)s')
    log_file = cmdline_options.log_file
    if log_file:
        log_file_handler = TimedRotatingFileHandler(log_file, when='midnight', backupCount=1)
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

    ### Importing all REST-routes
    from routes import (Main, Login, Beamline, Collection, Mockups, Utils,
                        SampleCentring, SampleChanger, Diffractometer, Queue,
                        lims, qutils, workflow, Detector)

    ### Install server-side UI state storage
    from mxcube3 import state_storage

    from queue_entry import CENTRING_METHOD

    def complete_initialization(app):
        app.beamline = hwr.getHardwareObject(cmdline_options.beamline_setup)
        app.xml_rpc_server = hwr.getHardwareObject('xml-rpc-server')
        app.session = app.beamline.getObjectByRole("session")
        app.collect = app.beamline.getObjectByRole("collect")
        app.workflow = app.beamline.getObjectByRole("workflow")
        app.shapes = app.beamline.getObjectByRole("shape_history")

        Utils.enable_snapshots(app.collect)

        app.diffractometer = app.beamline.getObjectByRole("diffractometer")

        if getattr(app.diffractometer, 'centring_motors_list', None) is None:
            # centring_motors_list is the list of roles corresponding to diffractometer motors
            app.diffractometer.centring_motors_list = app.diffractometer.getPositions().keys()

        app.db_connection = app.beamline.getObjectByRole("lims_client")
        app.empty_queue = pickle.dumps(hwr.getHardwareObject(cmdline_options.queue_model))
        app.sample_changer = app.beamline.getObjectByRole("sample_changer")
        app.sc_maintenance = app.beamline.getObjectByRole("sample_changer_maintenance")
        app.rest_lims = app.beamline.getObjectByRole("lims_rest_client")
        app.queue = qutils.new_queue()
        app.actions = hwr.getHardwareObject(cmdline_options.beamline_actions)
        app.plotting = hwr.getHardwareObject(cmdline_options.plotting)

        # SampleID of currently mounted sample
        app.CURRENTLY_MOUNTED_SAMPLE = None
        app.SAMPLE_TO_BE_MOUNTED = ''
        app.AUTO_MOUNT_SAMPLE = False
        app.AUTO_ADD_DIFFPLAN = False
        app.CENTRING_METHOD = CENTRING_METHOD.LOOP
        num_snapshots = app.collect.getProperty('num_snapshots')
        if num_snapshots is not None:
          app.NUM_SNAPSHOTS = num_snapshots
        else:
          app.NUM_SNAPSHOTS = 4
        app.NODE_ID_TO_LIMS_ID = {}
        app.INITIAL_FILE_LIST = []
        app.SC_CONTENTS = {"FROM_CODE": {}, "FROM_LOCATION": {}}
        app.SAMPLE_LIST = {"sampleList": {}, 'sampleOrder': []}

        # set up streaming
        from mxcube3.video import streaming

        try:
            streaming.init(app.diffractometer.camera, cmdline_options.video_device)
        except RuntimeError as ex:
            logging.getLogger('HWR').info(str(ex))
            app.VIDEO_DEVICE = None
        else:
            app.VIDEO_DEVICE = cmdline_options.video_device

        try:
            SampleCentring.init_signals()
            SampleChanger.init_signals()
            Beamline.init_signals()
        except Exception:
            sys.excepthook(*sys.exc_info())

        logging.getLogger("HWR").info("MXCuBE 3 initialized, it took %.1f seconds" % (time.time() - t0))
    # starting from here, requests can be received by server;
    # however, objects are not all initialized, so requests can return errors
    # TODO: synchronize web UI with server operation status
    gevent.spawn(complete_initialization, app)
