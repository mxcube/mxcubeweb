import logging
from pathlib import Path

import werkzeug
from flask import Flask, request
from flask_login import current_user
from flask_socketio import SocketIO
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

from mxcubeweb.core.server.csp import init_csp
from mxcubeweb.core.server.db import init_database
from mxcubeweb.core.server.limiter import init_rate_limiter
from mxcubeweb.core.server.security import init_flask_security
from mxcubeweb.core.util import networkutils


def http_exception_handler(e):
    err_msg = f"Error while calling {request.path}"

    if e.code == 404:
        logging.getLogger("server_access").info(
            f"URL {request.path} not found on server"
        )
    else:
        logging.getLogger("server_access").exception(err_msg)

    return "Not found", 404


class Server:
    def __init__(  # noqa: PLR0913
        self,
        flask,
        flask_socketio,
        db_session,
        user_datastore,
        security,
        limiter=None,
    ):
        self.flask = flask
        self.flask_socketio = flask_socketio
        self.db_session = db_session
        self.user_datastore = user_datastore
        self.limiter = limiter
        self.security = security

        self.restrict = networkutils.auth_required
        self.require_control = networkutils.require_control
        self.ws_restrict = networkutils.ws_valid_login_only
        self.route = staticmethod(self.flask.route)

    def emit(self, *args, **kwargs):
        from flask import has_request_context

        if has_request_context() and current_user.is_authenticated:
            logging.getLogger("server_access").debug(
                f"{current_user.username} websocket emit: {args} {kwargs}"
            )
        self.flask_socketio.emit(*args, **kwargs)

    def run(self, cfg):
        if cfg.flask.CERT == "SIGNED" and cfg.flask.CERT_PEM and cfg.flask.CERT_KEY:
            ssl_context = werkzeug.serving.load_ssl_context(
                cfg.flask.CERT_PEM, cfg.flask.CERT_KEY
            )
        elif cfg.flask.CERT == "ADHOC":
            cert_dir = Path(cfg.flask.USER_DB_PATH).parent
            ssl_context = werkzeug.serving.load_ssl_context(
                *werkzeug.serving.make_ssl_devcert(str(cert_dir))
            )
        else:
            ssl_context = None

        if ssl_context:
            self.flask_socketio.run(
                self.flask,
                host=cfg.flask.HOST,
                port=cfg.flask.PORT,
                ssl_context=ssl_context,
            )
        else:
            self.flask_socketio.run(
                self.flask,
                host=cfg.flask.HOST,
                port=cfg.flask.PORT,
            )

    def close(self):
        try:
            if self.db_session:
                self.db_session.close()
        except Exception:
            logging.getLogger("MX3.HWR").exception("Error while closing DB session")


def create_server(cfg, cmdline_options):
    template_dir = str(Path(__file__).parent / "templates")

    flask = Flask(
        __name__,
        static_folder=cmdline_options.static_folder,
        static_url_path="",
        template_folder=template_dir,
    )

    flask.config.from_object(cfg.flask)
    flask.wsgi_app = ProxyFix(flask.wsgi_app)
    flask.register_error_handler(HTTPException, http_exception_handler)

    init_csp(flask, cfg)
    socketio = SocketIO(
        flask, manage_session=False, cors_allowed_origins=cfg.flask.ALLOWED_CORS_ORIGINS
    )
    limiter = init_rate_limiter(flask)

    db_session, user_datastore = init_database(cfg)
    security = init_flask_security(flask, user_datastore)

    return Server(
        flask=flask,
        flask_socketio=socketio,
        db_session=db_session,
        user_datastore=user_datastore,
        limiter=limiter,
        security=security,
    )
