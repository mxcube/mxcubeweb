from __future__ import absolute_import
from flask import Flask, request
from flask.ext.socketio import SocketIO
from flask.ext.session import Session
from optparse import OptionParser
import os
import sys
import logging
from logging import StreamHandler, NullHandler
from logging.handlers import TimedRotatingFileHandler
import cPickle as pickle
import gevent
import traceback

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
                      help="Beamline setup HWR file",
                      default='/beamline-setup')
opt_parser.add_option("-q", "--queue-model",
                      dest="queue_model",
                      help="Queue model HWR file",
                      default='/queue-model')
cmdline_options, args = opt_parser.parse_args()

socketio = SocketIO()
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
# this line important for socketio msg, otherwise no msg is sent...
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
    custom_log_handler.setLevel(logging.INFO)
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
                        lims, qutils)

    ### Install server-side UI state storage
    from mxcube3 import state_storage

    def complete_initialization(app):
        app.beamline = hwr.getHardwareObject(cmdline_options.beamline_setup)
        app.session = app.beamline.getObjectByRole("session")
        app.collect = app.beamline.getObjectByRole("collect")

        Utils.enable_snapshots(app.collect)

        app.diffractometer = app.beamline.getObjectByRole("diffractometer")

        if getattr(app.diffractometer, 'centring_motors_list', None) is None:
            # centring_motors_list is the list of roles corresponding to diffractometer motors
            app.diffractometer.centring_motors_list = app.diffractometer.getPositions().keys()

        app.db_connection = app.beamline.getObjectByRole("lims_client")
        app.empty_queue = pickle.dumps(hwr.getHardwareObject(cmdline_options.queue_model))
        app.sample_changer = app.beamline.getObjectByRole("sample_changer")
        app.rest_lims = app.beamline.getObjectByRole("lims_rest_client")
        app.queue = qutils.new_queue()

        try:
            SampleCentring.init_signals()
            SampleChanger.init_signals()
            Beamline.init_signals()
        except Exception:
            sys.excepthook(*sys.exc_info())

    # starting from here, requests can be received by server;
    # however, objects are not all initialized, so requests can return errors
    # TODO: synchronize web UI with server operation status
    gevent.spawn(complete_initialization, app)
