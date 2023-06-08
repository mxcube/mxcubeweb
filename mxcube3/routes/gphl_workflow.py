# -*- coding: utf-8 -*-
import io

from flask import Blueprint, Response, jsonify, request, send_file


def init_route(app, server, url_prefix):
    bp = Blueprint("gphl_workflow", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def gphlworkflow():
        return jsonify(app.gphl_workflow.get_available_workflows())

    @bp.route("/", methods=["POST"])
    @server.restrict
    def submit_parameters():
        data = request.get_json()
        app.gphl_workflow.submit_parameters(data)
        return Response(status=200)

    return bp
