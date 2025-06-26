from flask import jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def rate_limit_error_handler(e):
    """Handler for rate limit errors"""
    return jsonify({"error": "Too many requests", "message": str(e.description)}), 429


class DummyLimiter:
    """Dummy limiter used when rate limiting is disabled"""

    def limit(self, _):
        def decorator(f):
            return f

        return decorator


def init_limiter(app):
    """Initialize the rate limiter"""
    if not app.config.get("RATE_LIMITER_ENABLED", True):
        return DummyLimiter()

    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=app.config.get(
            "RATELIMIT_DEFAULT", "2000 per day;500 per hour"
        ).split(";"),
        storage_uri=app.config.get("RATELIMIT_STORAGE_URI", "memory://"),
    )

    app.register_error_handler(429, rate_limit_error_handler)
    return limiter
