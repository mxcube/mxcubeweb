# -*- coding: utf-8 -*-
from mxcube3 import app as mxcube
from flask import Response, jsonify, request


@mxcube.route("/mxcube/api/v0.1/workflow", methods=['GET'])
def workflow():
    workflows = {}

    for wf in mxcube.workflow.get_available_workflows():
        workflows[wf["name"]] = wf
    
    return jsonify({"workflows": workflows})



@mxcube.route("/mxcube/api/v0.1/workflow/start", methods=['POST'])
def workflow_start():
    data = request.get_json()

    try:
         mxcube.workflow.start(data["path"])
         mxcube.CURRENT_WORKFLOW = data
    except:
        return Response(status=409)
    else:
        return Response(status=200)


@mxcube.route("/mxcube/api/v0.1/workflow/stop", methods=['POST'])
def workflow_stop():
    try:
         mxcube.CURRENT_WORKFLOW = None
         mxcube.workflow.abort()
    except:
        return Response(status=409)
    else:
        return Response(status=200)
