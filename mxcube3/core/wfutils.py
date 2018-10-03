# -*- coding: utf-8 -*-
from mxcube3 import blcontrol


def get_available_workflows():
    workflows = {}

    try:
        for wf in blcontrol.workflow.get_available_workflows():
            # Rename name and path to wfname and wfpath in order to avoid name
            # clashes
            wf["wfname"] = wf.pop("name")
            wf["wfpath"] = wf.pop("path")

            workflows[wf["wfname"]] = wf
    except Exception:
        pass

    return {"workflows": workflows}


def submit_parameters(params):
    blcontrol.workflow.set_values_map(params)


def test_workflow_dialog(wf):
    dialog = {
        "properties": {
            "name": {
                "title": "Task name",
                "type": "string",
                "minLength": 2
            },
            "description": {
                "title": "Description",
                "type": "string",
                "widget": "textarea"
            },
            "dueTo": {
                "title": "Due to",
                "type": "string",
                "widget": "compatible-datetime",
                "format": "date-time"
            }
        },
        "required": ["name"],
        "dialogName": "Trouble shooting !"
    }

    return dialog
