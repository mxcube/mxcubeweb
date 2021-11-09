# -*- coding: utf-8 -*-
import base64

from mxcube3.core.component import Component


class Workflow(Component):
    def __init__(self, app, server, config):
        super().__init__(app, server, config)

    def get_available_workflows(self):
        workflows = {}
        beamline = self.app.mxcubecore.beamline_ho

        try:
            for wf in beamline.workflow.get_available_workflows():
                # Rename name and path to wfname and wfpath in order to avoid name
                # clashes
                wf["wfname"] = wf.pop("name")
                wf["wfpath"] = wf.pop("path")

                workflows[wf["wfname"]] = wf
        except Exception:
            pass

        if hasattr(beamline, "gphl_workflow"):
            # Add Global Phasing workflows if available
            # PLEASE do not comment out
            # If you do not want this activated,
            # just remove gphl_workflow from the configuration
            workflows.update(beamline.gphl_workflow.get_available_workflows())
        return {"workflows": workflows}

    def submit_parameters(self, params):
        self.app.mxcubecore.beamline_ho.workflow.set_values_map(params)

    def get_mesh_result(self, gid, _type="heatmap"):
        base64data = self.app.mxcubecore.beamline_ho.sample_view.get_grid_data(gid)
        base64data = base64data if base64data else ""

        data = base64.b64decode(base64data)
        return data

    def test_workflow_dialog(self, wf):
        dialog = {
            "properties": {
                "name": {"title": "Task name", "type": "string", "minLength": 2},
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
