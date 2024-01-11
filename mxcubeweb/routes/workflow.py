# -*- coding: utf-8 -*-
import io

from flask import Blueprint, Response, jsonify, request, send_file


def init_route(app, server, url_prefix):
    bp = Blueprint("workflow", __name__, url_prefix=url_prefix)

    @bp.route("/", methods=["GET"])
    @server.restrict
    def workflow():
        return jsonify(app.workflow.get_available_workflows())

    @bp.route("/", methods=["POST"])
    @server.restrict
    def submit_parameters():
        data = request.get_json()
        app.workflow.submit_parameters(data)
        return Response(status=200)

    @bp.route("/gphl", methods=["POST"])
    @server.restrict
    def submit_gphl_parameters():
        data = request.get_json()
        app.workflow.update_gphl_parameters(data)
        return Response(status=200)

    @bp.route("/mesh_result/<gid>/<t>", methods=["GET"])
    # @server.restrict
    def get_grid_data(gid, t, rand):
        res = send_file(
            io.BytesIO(app.workflow.get_mesh_result(gid, t)),
            mimetype="image/png",
        )

        return res

    # This route is only for testing
    @bp.route("/dialog/<wf>", methods=["GET"])
    @server.restrict
    def workflow_dialog(wf):
        dialog = app.workflow.test_workflow_dialog(wf)
        server.emit("workflowParametersDialog", dialog, namespace="/hwr")

        return Response(status=200)

    return bp
