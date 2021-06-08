import traceback
import logging
import signal
import atexit
import os
import time

import gevent

from flask import Flask, request, session
from flask_socketio import SocketIO
from flask_session import Session

class Server():
    INIT_EVENT = gevent.event.Event()
    FLASK = None
    FLASK_SESSION = None
    FLASK_SOCKETIO = None

    @staticmethod
    def exception_handler(e):
        err_msg = "Uncaught exception while calling %s" % request.path
        logging.getLogger("exceptions").exception(err_msg)
        return err_msg + ": " + traceback.format_exc(), 409

    @staticmethod
    def kill_processes():
        # Killing the processes causes pytest to fail because
        # of non zero exit code, so we dont kill the processes
        # when running the tests
        if not Server.FLASK.testing:
            with open("/tmp/mxcube.pid", "r") as f:
                pid_list = f.read().strip()
                pid_list = pid_list.split(" ")
                pid_list.reverse()

            with open("/tmp/mxcube.pid", "w") as f:
                f.write("")

            for pid in pid_list:
                os.kill(int(pid), signal.SIGKILL)

    @staticmethod
    def init(cmdline_options, cfg, mxcube):
        t0 = time.time()

        template_dir = os.path.join(os.path.dirname(__file__), "templates")
        Server.FLASK = Flask(__name__, static_url_path="", template_folder=template_dir)

        Server.FLASK.config.from_object(cfg.FLASK)
        Server.FLASK.register_error_handler(Exception, Server.exception_handler)

        Server.FLASK_SESSION = Session()
        Server.FLASK_SESSION.init_app(Server.FLASK)

        Server.FLASK_SOCKETIO = SocketIO(manage_session=False, cors_allowed_origins=cfg.FLASK.ALLOWED_CORS_ORIGINS)
        Server.FLASK_SOCKETIO.init_app(Server.FLASK)

        # the following test prevents Flask from initializing twice
        # (because of the Reloader)

        if not Server.FLASK.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
            atexit.register(Server.kill_processes)

            with open("/tmp/mxcube.pid", "w") as f:
                f.write(str(os.getpid()) + " ")

            from core import loginutils

            # Make the valid_login_only decorator available on server object
            Server.restrict = staticmethod(loginutils.valid_login_only)
            Server.require_control = staticmethod(loginutils.require_control)
            Server.ws_restrict = staticmethod(loginutils.ws_valid_login_only)

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

    @staticmethod
    def register_routes(mxcube):
        from mxcube3.routes.beamline import init_routes as init_beamline_routes
        Server.FLASK.register_blueprint(init_beamline_routes(mxcube))


    @staticmethod
    def emit(*args, **kwargs):
        Server.FLASK_SOCKETIO.emit(*args, **kwargs)

    @staticmethod
    def run():
        Server.FLASK_SOCKETIO.run(Server.FLASK, host="0.0.0.0", port=8081)
