import traceback
import logging
import signal
import atexit
import os
import werkzeug

import gevent

from werkzeug.middleware.proxy_fix import ProxyFix
from flask import Flask, request
from flask_socketio import SocketIO

import flask_security

from spectree import SpecTree

from mxcubeweb.core.util import networkutils
from mxcubeweb.core.components.user.database import (
    init_db,
    UserDatastore,
)
from mxcubeweb.core.models.usermodels import User, Role, Message


class Server:
    init_event = gevent.event.Event()
    flask = None
    security = None
    api = None
    user_datastore = None
    db_session = None
    flask_socketio = None

    def __init__(self):
        raise NotImplementedError(
            "Server is to be used as a pure static class, don't instantiate."
        )

    @staticmethod
    def exception_handler(e):
        err_msg = "Uncaught exception while calling %s" % request.path
        logging.getLogger("exceptions").exception(err_msg)
        return err_msg + ": " + traceback.format_exc(), 409

    @staticmethod
    def kill_processes():
        # Killing the processes causes pytest to fail because
        # of non-zero exit code, so we don't kill the processes
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
    def init(cmdline_options, cfg):
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
            manage_session=False,
            cors_allowed_origins=cfg.flask.ALLOWED_CORS_ORIGINS,
        )
        Server.flask_socketio.init_app(Server.flask)

        Server.api = SpecTree(
            "flask",
            app=Server.flask,
            title="MXCuBE Web api",
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
            Server.restrict = staticmethod(networkutils.auth_required)
            Server.require_control = staticmethod(networkutils.require_control)
            Server.ws_restrict = staticmethod(networkutils.ws_valid_login_only)
            Server.route = staticmethod(Server.flask.route)

    def _register_route(init_blueprint_fn, app, url_prefix):
        bp = init_blueprint_fn(app, Server, url_prefix)

        Server.flask.register_blueprint(bp)

        for key, function in Server.flask.view_functions.items():
            if key.startswith(bp.name):
                if not hasattr(function, "tags"):
                    function.tags = [bp.name.title().replace("_", " ")]

    @staticmethod
    def register_routes(mxcube):
        Server.security = flask_security.Security(
            Server.flask, Server.user_datastore, register_blueprint=False
        )

        from mxcubeweb.routes.beamline import (
            init_route as init_beamline_route,
        )
        from mxcubeweb.routes.detector import (
            init_route as init_detector_route,
        )
        from mxcubeweb.routes.diffractometer import (
            init_route as init_diffractometer_route,
        )
        from mxcubeweb.routes.lims import init_route as init_lims_route
        from mxcubeweb.routes.log import init_route as init_log_route
        from mxcubeweb.routes.login import (
            init_route as init_login_route,
        )
        from mxcubeweb.routes.main import init_route as init_main_route
        from mxcubeweb.routes.mockups import (
            init_route as init_mockups_route,
        )
        from mxcubeweb.routes.queue import (
            init_route as init_queue_route,
        )
        from mxcubeweb.routes.ra import init_route as init_ra_route
        from mxcubeweb.routes.samplecentring import (
            init_route as init_sampleview_route,
        )
        from mxcubeweb.routes.samplechanger import (
            init_route as init_samplechanger_route,
        )
        from mxcubeweb.routes.workflow import (
            init_route as init_workflow_route,
        )
        from mxcubeweb.routes.harvester import init_route as init_harvester_route

        url_root_prefix = "/mxcube/api/v0.1"

        Server._register_route(
            init_beamline_route, mxcube, f"{url_root_prefix}/beamline"
        )

        Server._register_route(
            init_detector_route, mxcube, f"{url_root_prefix}/detector"
        )

        Server._register_route(
            init_diffractometer_route,
            mxcube,
            f"{url_root_prefix}/diffractometer",
        )

        Server._register_route(init_lims_route, mxcube, f"{url_root_prefix}/lims")

        Server._register_route(init_log_route, mxcube, f"{url_root_prefix}/log")

        Server._register_route(init_login_route, mxcube, f"{url_root_prefix}/login")

        Server._register_route(init_main_route, mxcube, f"{url_root_prefix}")

        Server._register_route(init_mockups_route, mxcube, f"{url_root_prefix}/mockups")

        Server._register_route(init_queue_route, mxcube, f"{url_root_prefix}/queue")

        Server._register_route(init_ra_route, mxcube, f"{url_root_prefix}/ra")

        Server._register_route(
            init_sampleview_route,
            mxcube,
            f"{url_root_prefix}/sampleview",
        )

        Server._register_route(
            init_samplechanger_route,
            mxcube,
            f"{url_root_prefix}/sample_changer",
        )

        Server._register_route(
            init_workflow_route, mxcube, f"{url_root_prefix}/workflow"
        )

        Server._register_route(
            init_harvester_route, mxcube, f"{url_root_prefix}/harvester"
        )

        Server.security = flask_security.Security(Server.flask, Server.user_datastore)

    @staticmethod
    def emit(*args, **kwargs):
        Server.flask_socketio.emit(*args, **kwargs)

    @staticmethod
    def run(cfg):
        if cfg.flask.CERT == "SIGNED" and cfg.flask.CERT_PEM and cfg.flask.CERT_KEY:
            ssl_context = werkzeug.serving.load_ssl_context(
                cfg.flask.CERT_PEM, cfg.flask.CERT_KEY
            )
        elif cfg.flask.CERT == "ADHOC":
            ssl_context = werkzeug.serving.load_ssl_context(
                *werkzeug.serving.make_ssl_devcert("/tmp/")
            )
        else:
            ssl_context = None

        if ssl_context:
            Server.flask_socketio.run(
                Server.flask,
                ssl_context=ssl_context,
                host="0.0.0.0",
                port=8081,
            )
        else:
            Server.flask_socketio.run(Server.flask, host="0.0.0.0", port=8081)
