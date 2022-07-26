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

    # # This route is only for testing
    # @bp.route("/dialog/<wf>", methods=["GET"])
    # @server.restrict
    # def gphl_workflow_dialog(wf):
    #     dialog = app.gphl_workflow.test_workflow_dialog(wf)
    #     server.emit("gphlWorkflowParametersDialog", dialog, namespace="/hwr")
    #
    #     return Response(status=200)

    return bp
