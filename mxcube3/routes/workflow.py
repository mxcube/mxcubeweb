# -*- coding: utf-8 -*-
from mxcube3 import socketio
from mxcube3 import app as mxcube
from flask import Response, jsonify, request


@mxcube.route("/mxcube/api/v0.1/workflow", methods=['GET'])
def workflow():
    workflows = {}
    try:
        for wf in mxcube.workflow.get_available_workflows():
            # Rename name and path to wfname and wfpath in order to avoid name
            # clashes
            wf["wfname"] = wf.pop("name")
            wf["wfpath"] = wf.pop("path")

            workflows[wf["wfname"]] = wf
    except Exception:
        pass
    
    return jsonify({"workflows": workflows})


@mxcube.route("/mxcube/api/v0.1/workflow", methods=['POST'])
def sumbit_parameters():
    data = request.get_json()
    mxcube.workflow.set_values_map(data)


# This route is only for testing
@mxcube.route("/mxcube/api/v0.1/workflow/dialog/<wf>", methods=['GET'])
def workflow_dialog(wf):
    dialog = {
        "properties": {
            "name": {
                "title":"Task name",
                "type":"string",
                "minLength": 2
                },
            "description": {
                "title":"Description",
                "type":"string",
                "widget":"textarea"
                },
            "dueTo": {
                "title":"Due to",
                "type":"string",
                "widget":"compatible-datetime",
                "format":"date-time"
                }
            },
        "required":["name"],
        "dialogName": "Trouble shooting !"
        }
    
    socketio.emit("workflowParametersDialog", dialog, namespace="/hwr")
    
    return Response(status=200)
