# -*- coding: utf-8 -*-
import base64

import copy

from mxcube3.core.components.component_base import ComponentBase

from mxcubecore import HardwareRepository as HWR


class GphlWorkflow(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def get_available_workflows(self):
        return {
            "workflows":
            copy.deepcopy(HWR.beamline.gphl_workflow.get_available_workflows())
        }

    def submit_parameters(self, params):
        HWR.beamline.gphl_workflow.set_values_map(params)

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
