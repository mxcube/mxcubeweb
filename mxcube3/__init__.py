from __future__ import absolute_import
from flask import Flask, request
from flask.ext.socketio import SocketIO
from flask.ext.session import Session
from optparse import OptionParser
import os
import sys
import logging
import cPickle as pickle
import gevent
import traceback

opt_parser = OptionParser()
opt_parser.add_option("-r", "--repository",
                      dest="hwr_directory",
                      help="Hardware Repository XML files path",
                      default=os.path.join(os.path.dirname(__file__), 'HardwareObjects.xml/'))
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
    logging.exception(err_msg)
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
    from HardwareRepository import HardwareRepository as hwr, setLogFile
    hwr.addHardwareObjectsDirs([os.path.join(os.path.dirname(__file__), 'HardwareObjects')])

    hwr_directory = cmdline_options.hwr_directory
    hwr = hwr.HardwareRepository(os.path.abspath(os.path.expanduser(hwr_directory)))
    hwr.connect()
    log_file = cmdline_options.log_file
    if log_file:
        setLogFile(log_file)

    # installs logging handler to send messages to clients
    import logging_handler
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    custom_log_handler = logging_handler.MX3LoggingHandler()
    custom_log_handler.setLevel(logging.DEBUG)
    root_logger.addHandler(custom_log_handler)
    hwr_logger = logging.getLogger("HWR")
    user_logger = logging.getLogger("user_level_log")
    queue_logger = logging.getLogger("queue_exec")
#    hwr_logger.addHandler(custom_log_handler)
#    user_logger.addHandler(custom_log_handler)
#    queue_logger.addHandler(custom_log_handler)
    app.log_handler = custom_log_handler

    ### Importing all REST-routes
    from routes import (Main, Login, Beamline, Collection, Mockups,
                        SampleCentring, SampleChanger, Diffractometer, Utils)

    ### Install server-side UI state storage
    import state_storage

    def complete_initialization(app):
        app.beamline = hwr.getHardwareObject(cmdline_options.beamline_setup)
        app.session = app.beamline.getObjectByRole("session")
        app.collect = app.beamline.getObjectByRole("collect")
        app.diffractometer = app.beamline.getObjectByRole("diffractometer")

        if getattr(app.diffractometer, 'centring_motors_list', None) is None:
            # centring_motors_list is the list of roles corresponding to diffractometer motors
            app.diffractometer.centring_motors_list = app.diffractometer.getPositions().keys()

        app.db_connection = app.beamline.getObjectByRole("lims_client")
        app.empty_queue = pickle.dumps(hwr.getHardwareObject(cmdline_options.queue_model))
        app.sample_changer = app.beamline.getObjectByRole("sample_changer")

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

