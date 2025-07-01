import logging

from flask import Blueprint, jsonify, request


def init_route(_mxcube_app, _server, url_prefix):
    """
    Initialize CSP report routes
    url_prefix: URL prefix for the blueprint
    """
    bp = Blueprint("csp", __name__, url_prefix=url_prefix)

    csp_logger = logging.getLogger("csp")
    if not csp_logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        )
        csp_logger.addHandler(handler)
        csp_logger.setLevel(logging.WARNING)

    @bp.route("/report", methods=["POST"])
    def csp_report():
        """Endpoint to collect CSP violation reports"""
        report = request.get_json()
        csp_logger.warning("CSP Violation: %s", report.get("csp-report", {}))
        return jsonify({"status": "report received"}), 204

    return bp
