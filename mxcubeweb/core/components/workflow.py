# -*- coding: utf-8 -*-
import base64

from mxcubeweb.core.components.component_base import ComponentBase

from mxcubecore import HardwareRepository as HWR


class Workflow(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def get_available_workflows(self):
        workflows = {}
        beamline = HWR.beamline

        try:
            for wf in beamline.workflow.get_available_workflows():
                # Rename name and path to wfname and wfpath in order to avoid name
                # clashes
                wf["wfname"] = wf.pop("name")
                wf["wfpath"] = wf.pop("path")

                workflows[wf["wfname"]] = wf
        except Exception:
            pass

        if getattr(beamline, "gphl_workflow", None):
            # Add Global Phasing workflows if available
            workflows.update(beamline.gphl_workflow.get_available_workflows())

        return {"workflows": workflows}

    def submit_parameters(self, params):
        HWR.beamline.workflow.set_values_map(params)

    def update_gphl_parameters(self, params):
        HWR.beamline.emit(params["signal"], params["instruction"], params["data"])

    def get_mesh_result(self, gid, _type="heatmap"):
        base64data = HWR.beamline.sample_view.get_grid_data(gid)
        base64data = base64data if base64data else ""

        data = base64.b64decode(base64data)
        return data

    def test_workflow_dialog(self, wf):
        dialog = {
            "properties": {
                "name": {
                    "title": "Task name",
                    "type": "string",
                    "minLength": 2,
                },
                "description": {
                    "title": "Description",
                    "type": "string",
                    "widget": "textarea",
                },
                "dueTo": {
                    "title": "Due to",
                    "type": "string",
                    "widget": "compatible-datetime",
                    "format": "date-time",
                },
            },
            "required": ["name"],
            "dialogName": "Trouble shooting !",
        }

        return dialog
