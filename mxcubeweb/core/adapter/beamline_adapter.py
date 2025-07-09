import logging

import pydantic

BEAMLINE_ADAPTER = None

# Singleton like interface is needed to keep the same reference to the
# adapter object and its corresponding hardware objects, so that the signal
# system won't clean up signal handlers. (PyDispatcher removes signal handlers
# when an object is garbage collected)


def BeamlineAdapter(*args):
    global BEAMLINE_ADAPTER

    if BEAMLINE_ADAPTER is None:
        BEAMLINE_ADAPTER = _BeamlineAdapter(*args)

    return BEAMLINE_ADAPTER


class _BeamlineAdapter:
    """
    Adapter between Beamline route and Beamline hardware object.
    """

    def __init__(self, beamline_hwobj, app):
        self.app = app
        self._bl = beamline_hwobj
        self.adapter_dict = {}

        workflow = self._bl.workflow
        if workflow:
            workflow.connect("parametersNeeded", self.wf_parameters_needed)

        gphl_workflow = self._bl.gphl_workflow
        if gphl_workflow:
            gphl_workflow.connect(
                "GphlJsonParametersNeeded", self.gphl_json_wf_parameters_needed
            )
            gphl_workflow.connect(
                "GphlUpdateUiParameters", self.gphl_json_wf_update_ui_parameters
            )

    def wf_parameters_needed(self, params):
        self.app.server.emit("workflowParametersDialog", params, namespace="/hwr")

    def gphl_json_wf_parameters_needed(self, schema, ui_schema):
        params = {}
        params["schema"] = schema
        params["ui_schema"] = ui_schema
        self.app.server.emit("gphlWorkflowParametersDialog", params, namespace="/hwr")

    def gphl_json_wf_update_ui_parameters(self, update_dict):
        self.app.server.emit(
            "gphlWorkflowUpdateUiParametersDialog", update_dict, namespace="/hwr"
        )

    def get_object(self, name):
        return self._ho.get_hardware_object(name)

    def dict(self):
        """
        Build dictionary value-representation for each beamline attribute
         Returns:
           (dict): The dictionary.
        """
        attributes = {}

        for attr_name in self.app.mxcubecore.adapter_dict:
            try:
                _d = self.app.mxcubecore.get_adapter(attr_name).data().dict()
            except pydantic.ValidationError:
                logging.getLogger("MX3.HWR").error(f"Incorrect values in {attr_name}")
                logging.getLogger("MX3.HWR").exception("")

            attributes.update({attr_name: _d})

        return {"hardwareObjects": attributes}

    def get_available_elements(self):
        escan = self._bl.energy_scan
        elements = []

        if escan:
            elements = escan.get_elements()

        return {"elements": elements}
