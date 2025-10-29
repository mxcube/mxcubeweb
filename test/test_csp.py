import json
from unittest.mock import Mock, patch

import pytest
from flask import Flask, jsonify

from mxcubeweb.core.server.csp import CSPMiddleware
from mxcubeweb.routes.csp_report import init_route


class TestCSPMiddleware:
    """Tests for the CSP middleware."""

    def test_csp_middleware_enabled(self):
        """Test that CSP middleware adds standard headers when enabled."""
        config = {
            "CSP_ENABLED": True,
            "CSP_POLICY": {
                "default-src": ["'self'"],
                "script-src": ["'self'", "'unsafe-inline'"],
            },
            "CSP_REPORT_ONLY": False,
            "CSP_REPORT_URI": "",
        }

        mock_start_response = Mock()
        captured_headers = []

        def mock_app(_environ, start_response):
            status = "200 OK"
            headers = [("Content-Type", "text/plain")]
            start_response(status, headers)
            mock_app.last_start_response = start_response
            return [b"Response body"]

        middleware = CSPMiddleware(mock_app, config)

        def original_start_response(_status, headers, _exc_info=None):
            captured_headers.extend(headers)
            return mock_start_response

        middleware({}, original_start_response)

        csp_headers = [h for h in captured_headers if h[0] == "Content-Security-Policy"]
        assert len(csp_headers) == 1
        assert "default-src 'self'" in csp_headers[0][1]
        assert "script-src 'self' 'unsafe-inline'" in csp_headers[0][1]

    def test_csp_middleware_report_only(self):
        """Test that CSP middleware sets Report-Only mode when configured."""
        config = {
            "CSP_ENABLED": True,
            "CSP_POLICY": {"default-src": ["'self'"]},
            "CSP_REPORT_ONLY": True,
            "CSP_REPORT_URI": "",
        }

        mock_start_response = Mock()
        captured_headers = []

        def mock_app(_environ, start_response):
            status = "200 OK"
            headers = [("Content-Type", "text/plain")]
            start_response(status, headers)
            mock_app.last_start_response = start_response
            return [b"Response body"]

        middleware = CSPMiddleware(mock_app, config)

        def original_start_response(_status, headers, _exc_info=None):
            captured_headers.extend(headers)
            return mock_start_response

        middleware({}, original_start_response)

        csp_headers = [
            h for h in captured_headers if h[0] == "Content-Security-Policy-Report-Only"
        ]
        assert len(csp_headers) == 1

    def test_csp_middleware_report_uri(self):
        """Test that CSP middleware adds report-uri when configured."""
        config = {
            "CSP_ENABLED": True,
            "CSP_POLICY": {"default-src": ["'self'"]},
            "CSP_REPORT_ONLY": False,
            "CSP_REPORT_URI": "/mxcube/api/v0.1/csp/report",
        }

        mock_start_response = Mock()
        captured_headers = []

        def mock_app(_environ, start_response):
            status = "200 OK"
            headers = [("Content-Type", "text/plain")]
            start_response(status, headers)
            mock_app.last_start_response = start_response
            return [b"Response body"]

        middleware = CSPMiddleware(mock_app, config)

        def original_start_response(_status, headers, _exc_info=None):
            captured_headers.extend(headers)
            return mock_start_response

        middleware({}, original_start_response)

        csp_headers = [h for h in captured_headers if h[0] == "Content-Security-Policy"]
        assert len(csp_headers) == 1
        assert "report-uri /mxcube/api/v0.1/csp/report" in csp_headers[0][1]

    def test_csp_middleware_disabled(self):
        """Test that CSP middleware doesn't add any headers when disabled."""
        config = {
            "CSP_ENABLED": False,
            "CSP_POLICY": {"default-src": ["'self'"]},
        }

        mock_start_response = Mock()
        captured_headers = []

        def mock_app(_environ, start_response):
            status = "200 OK"
            headers = [("Content-Type", "text/plain")]
            start_response(status, headers)
            return [b"Response body"]

        middleware = CSPMiddleware(mock_app, config)

        def original_start_response(_status, headers, _exc_info=None):
            captured_headers.extend(headers)
            return mock_start_response

        middleware({}, original_start_response)

        csp_headers = [
            h for h in captured_headers if h[0].startswith("Content-Security-Policy")
        ]
        assert len(csp_headers) == 0

    def test_build_policy_string(self):
        """Test that CSP policy string is correctly built from dictionary."""
        config = {
            "CSP_ENABLED": True,
            "CSP_POLICY": {
                "default-src": ["'self'"],
                "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                "img-src": ["'self'", "data:", "blob:"],
            },
            "CSP_REPORT_ONLY": False,
            "CSP_REPORT_URI": "/report",
        }

        middleware = CSPMiddleware(Mock(), config)
        captured_headers = []

        def mock_app(_environ, start_response):
            start_response("200 OK", [])
            return [b""]

        def capture_start_response(_status, headers, _exc_info=None):
            captured_headers.extend(headers)

        middleware.app = mock_app
        middleware({}, capture_start_response)

        csp_header = next(
            (h[1] for h in captured_headers if h[0] == "Content-Security-Policy"), ""
        )

        assert "default-src 'self'" in csp_header
        assert "script-src 'self' 'unsafe-inline' 'unsafe-eval'" in csp_header
        assert "img-src 'self' data: blob:" in csp_header
        assert "report-uri /report" in csp_header


class TestCSPReportEndpoint:
    """Tests for the CSP report endpoint."""

    @pytest.fixture
    def test_app(self):
        """Create a test Flask app with the CSP report endpoint."""
        app = Flask(__name__)
        app.config["TESTING"] = True

        bp = init_route(None, None, "/csp")
        app.register_blueprint(bp)

        return app

    @pytest.fixture
    def client(self, test_app):
        return test_app.test_client()

    def test_csp_report_endpoint(self, client):
        """Test that CSP violation reports are received and logged correctly."""
        test_report = {
            "csp-report": {
                "document-uri": "http://localhost:8081/",
                "referrer": "",
                "violated-directive": "script-src-elem",
                "effective-directive": "script-src-elem",
                "original-policy": "default-src 'self'",
                "disposition": "enforce",
                "blocked-uri": "http://malicious-site.com/script.js",
                "status-code": 0,
            }
        }

        with patch("logging.Logger.warning") as mock_warning:
            resp = client.post(
                "/csp/report",
                data=json.dumps(test_report),
                content_type="application/json",
            )

            assert resp.status_code == 204
            mock_warning.assert_called_once()
            log_args = mock_warning.call_args[0]
            assert "CSP Violation" in log_args[0]


class TestCSPIntegration:
    """Integration tests for CSP implementation."""

    @pytest.fixture
    def app_with_csp(self):
        """Create a test Flask app with CSP middleware applied."""
        app = Flask(__name__)
        app.config["TESTING"] = True

        config = {
            "CSP_ENABLED": True,
            "CSP_POLICY": {
                "default-src": ["'self'"],
                "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            },
            "CSP_REPORT_ONLY": False,
            "CSP_REPORT_URI": "",
        }

        app.wsgi_app = CSPMiddleware(app.wsgi_app, config)

        @app.route("/test")
        def test_route():
            return jsonify({"status": "ok"})

        return app

    @pytest.fixture
    def client(self, app_with_csp):
        return app_with_csp.test_client()

    def test_csp_headers_in_response(self, client):
        """Test that CSP headers are correctly included in actual HTTP responses."""
        resp = client.get("/test")

        assert "Content-Security-Policy" in resp.headers

        policy = resp.headers["Content-Security-Policy"]
        assert "default-src 'self'" in policy
        assert "script-src 'self' 'unsafe-inline' 'unsafe-eval'" in policy
