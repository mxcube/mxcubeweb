import json
from unittest.mock import MagicMock

import pytest
from flask import Flask, jsonify

from mxcubeweb.core.server.limiter import init_limiter, rate_limit_error_handler


@pytest.fixture
def limiter_app():
    """Create a fresh Flask app with limiter for testing"""
    app = Flask("limiter_test")
    app.config["RATELIMIT_DEFAULT"] = "3 per minute"
    app.config["RATELIMIT_STORAGE_URI"] = "memory://"
    app.config["RATELIMIT_HEADERS_ENABLED"] = True

    init_limiter(app)

    @app.route("/test_rate_limit")
    def test_endpoint():
        return jsonify({"status": "success"})

    return app


def test_rate_limiter_initialization():
    """Test that the limiter initializes correctly with various configurations"""
    app = Flask("limiter_test")

    app.config["RATELIMIT_DEFAULT"] = "100 per day;10 per hour"
    app.config["RATELIMIT_STORAGE_URI"] = "memory://"
    limiter = init_limiter(app)

    assert limiter is not None
    assert hasattr(limiter, "limit")

    error_handlers = app.error_handler_spec.get(None, {}).get(429, None)
    assert error_handlers is not None, "Rate limit error handler was not registered"


def test_rate_limit_error_handler(limiter_app):
    """Test the rate limit error handler directly"""
    mock_error = MagicMock()
    mock_error.description = "Rate limit exceeded: 100 per minute"

    with limiter_app.app_context():
        response, status_code = rate_limit_error_handler(mock_error)
        data = json.loads(response.data)

        assert status_code == 429
        assert data["error"] == "Too many requests"
        assert data["message"] == "Rate limit exceeded: 100 per minute"


def test_rate_limiter_enforcement(limiter_app):
    """Test that the rate limiter enforces limits"""
    client = limiter_app.test_client()

    for _ in range(3):
        response = client.get("/test_rate_limit")
        assert response.status_code == 200

    response = client.get("/test_rate_limit")
    assert response.status_code == 429

    data = json.loads(response.data)
    assert "error" in data
    assert data["error"] == "Too many requests"
    assert "message" in data
