import traceback
import logging
import signal
import atexit
import os
import time

import gevent

from werkzeug.middleware.proxy_fix import ProxyFix
from flask import Flask, request
from flask_socketio import SocketIO

import flask_security

from spectree import SpecTree

from mxcube3.core.util import networkutils
from mxcube3.core.components.user.database import init_db, UserDatastore
from mxcube3.core.models.usermodels import User, Role, Message


class Server:
    init_event = gevent.event.Event()
    flask = None
    flask_session = None
    security = None
    api = None
    user_datastore = None
    db_session = None
    flask_socketio = None

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
        if not Server.flask.testing:
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

        Server.flask = Flask(
            __name__,
            static_folder=cmdline_options.static_folder,
            static_url_path="",
            template_folder=template_dir,
        )
        Server.flask.wsgi_app = ProxyFix(Server.flask.wsgi_app)
        Server.flask.config.from_object(cfg.flask)
        Server.flask.register_error_handler(Exception, Server.exception_handler)

        db_session = init_db(cfg.flask.USER_DB_PATH)
        Server.user_datastore = UserDatastore(
            db_session, User, Role, message_model=Message
        )

        Server.db_session = db_session

        Server.flask_socketio = SocketIO(
            manage_session=False, cors_allowed_origins=cfg.flask.ALLOWED_CORS_ORIGINS
        )
        Server.flask_socketio.init_app(Server.flask)

        Server.api = SpecTree(
            "flask",
            app=Server.flask,
            title="MXCuBE3 api",
            version="v1.0",
            annotations=True,
        )
        Server.validate = Server.api.validate

        # the following test prevents Flask from initializing twice
        # (because of the Reloader)
        if not Server.flask.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
            atexit.register(Server.kill_processes)

            with open("/tmp/mxcube.pid", "w") as f:
                f.write(str(os.getpid()) + " ")

            # Make the valid_login_only decorator available on server object
            Server.restrict = staticmethod(networkutils.login_required)
            Server.require_control = staticmethod(networkutils.require_control)
            Server.ws_restrict = staticmethod(networkutils.ws_valid_login_only)
            Server.route = staticmethod(Server.flask.route)

            msg = "MXCuBE 3 initialized, it took %.1f seconds" % (time.time() - t0)
            logging.getLogger("MX3.HWR").info(msg)

    def _register_route(init_blueprint_fn, app, url_prefix, tag=None):
        tag = url_prefix if tag is None else tag
        bp = init_blueprint_fn(app, Server, url_prefix)

        Server.flask.register_blueprint(bp)

        for key, function in Server.flask.view_functions.items():
            if key.startswith(bp.name):
                if not hasattr(function, "tags"):
                    function.tags = [bp.name.title().replace("_", " ")]

    @staticmethod
    def register_routes(mxcube):
        from mxcube3.routes.beamline import init_route as init_beamline_route
        from mxcube3.routes.detector import init_route as init_detector_route
        from mxcube3.routes.diffractometer import (
            init_route as init_diffractometer_route,
        )
        from mxcube3.routes.lims import init_route as init_lims_route
        from mxcube3.routes.log import init_route as init_log_route
        from mxcube3.routes.login import init_route as init_login_route
        from mxcube3.routes.main import init_route as init_main_route
        from mxcube3.routes.mockups import init_route as init_mockups_route
        from mxcube3.routes.queue import init_route as init_queue_route
        from mxcube3.routes.ra import init_route as init_ra_route
        from mxcube3.routes.samplecentring import init_route as init_sampleview_route
        from mxcube3.routes.samplechanger import init_route as init_samplechanger_route
        from mxcube3.routes.workflow import init_route as init_workflow_route
        from mxcube3.routes.gphl_workflow import init_route as init_gphl_workflow_route

        url_root_prefix = "/mxcube/api/v0.1"

        Server._register_route(
            init_beamline_route, mxcube, f"{url_root_prefix}/beamline"
        )

        Server._register_route(
            init_detector_route, mxcube, f"{url_root_prefix}/detector"
        )

        Server._register_route(
            init_diffractometer_route, mxcube, f"{url_root_prefix}/diffractometer"
        )

        Server._register_route(init_lims_route, mxcube, f"{url_root_prefix}/lims")

        Server._register_route(init_log_route, mxcube, f"{url_root_prefix}/log")

        Server._register_route(init_login_route, mxcube, f"{url_root_prefix}/login")

        Server._register_route(init_main_route, mxcube, f"{url_root_prefix}")

        Server._register_route(init_mockups_route, mxcube, f"{url_root_prefix}/mockups")

        Server._register_route(init_queue_route, mxcube, f"{url_root_prefix}/queue")

        Server._register_route(init_ra_route, mxcube, f"{url_root_prefix}/ra")

        Server._register_route(
            init_sampleview_route, mxcube, f"{url_root_prefix}/sampleview"
        )

        Server._register_route(
            init_samplechanger_route, mxcube, f"{url_root_prefix}/sample_changer"
        )

        Server._register_route(
            init_workflow_route, mxcube, f"{url_root_prefix}/workflow"
        )

        Server._register_route(
            init_gphl_workflow_route, mxcube, f"{url_root_prefix}/gphl_workflow"
        )

        Server.security = flask_security.Security(
            Server.flask,
            Server.user_datastore
        )

    @staticmethod
    def emit(*args, **kwargs):
        Server.flask_socketio.emit(*args, **kwargs)

    @staticmethod
    def run():
        Server.flask_socketio.run(Server.flask, host="0.0.0.0", port=8081)
