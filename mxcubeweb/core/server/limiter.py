import logging

from flask import jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def rate_limit_error_handler(_):
    """Handler for rate limit errors"""
    logging.warning("Rate limit exceeded")
    return jsonify(
        {
            "error": "Too many requests",
            "message": "Allowed number or requests reached. Try again later.",
        }
    ), 429


def init_limiter(app):
    """Initialize the rate limiter"""
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=app.config.get(
            "RATELIMIT_DEFAULT", "150000 per day;6000 per hour"
        ).split(";"),
        storage_uri=app.config.get("RATELIMIT_STORAGE_URI", "memory://"),
    )

    app.register_error_handler(429, rate_limit_error_handler)
    return limiter
