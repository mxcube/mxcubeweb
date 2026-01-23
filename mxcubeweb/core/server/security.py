import logging

import flask_security
from flask import redirect, request


def flask_security_custom_unauthn_handler(*args, **kwargs):  # noqa: ARG001
    logging.getLogger("server_access").exception(
        f"Authentication failed on {request.path}"
    )

    return redirect("/login")


def init_flask_security(app, user_datastore):
    app.config.update(
        SECURITY_LOGIN_URL=None,
        SECURITY_REDIRECT_BEHAVIOR="spa",
    )

    security = flask_security.Security()
    security.init_app(
        app,
        user_datastore,
        register_blueprint=False,
    )

    security.unauthz_handler(flask_security_custom_unauthn_handler)
    security.unauthn_handler(flask_security_custom_unauthn_handler)

    return security
