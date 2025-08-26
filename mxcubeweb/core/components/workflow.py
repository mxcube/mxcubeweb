import logging

from mxcubecore import HardwareRepository as HWR

from mxcubeweb.core.components.component_base import ComponentBase

hwr_logger = logging.getLogger("MX3.HWR")


class Workflow(ComponentBase):
    def __init__(self, app, config):
        super().__init__(app, config)

    def get_available_workflows(self):
        workflows = {}
        beamline = HWR.beamline

        if beamline.workflow:
            # Add workflows if available
            try:
                for wf in beamline.workflow.get_available_workflows():
                    # Rename name and path to wfname and wfpath in order to avoid name
                    # clashes
                    wf["wfname"] = wf.pop("name")
                    wf["wfpath"] = wf.pop("path")

                    workflows[wf["wfname"]] = wf
            except Exception:
                msg = "Problem with available workflows or naming/pathing: {wf.name}"
                hwr_logger.exception(msg)

        if beamline.gphl_workflow:
            # Add Global Phasing workflows if available
            workflows.update(beamline.gphl_workflow.get_available_workflows())

        return {"workflows": workflows}

    def submit_parameters(self, params):
        HWR.beamline.workflow.set_values_map(params)

    def update_gphl_parameters(self, params):
        HWR.beamline.emit(params["signal"], params["instruction"], params["data"])
