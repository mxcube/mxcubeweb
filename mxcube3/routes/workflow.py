# -*- coding: utf-8 -*-
from flask import Response, jsonify, request

from mxcube3 import socketio
from mxcube3 import server


from mxcube3.core import wfutils


@server.route("/mxcube/api/v0.1/workflow", methods=['GET'])
@server.restrict
def workflow():
    return jsonify(wfutils.get_available_workflows())


@server.route("/mxcube/api/v0.1/workflow", methods=['POST'])
@server.restrict
def sumbit_parameters():
    data = request.get_json()
    wfutils.submit_parameters(data)


# This route is only for testing
@server.route("/mxcube/api/v0.1/workflow/dialog/<wf>", methods=['GET'])
@server.restrict
def workflow_dialog(wf):
    dialog = wfutils.test_workflow_dialog(wf)
    socketio.emit("workflowParametersDialog", dialog, namespace="/hwr")

    return Response(status=200)
