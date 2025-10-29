import logging
from typing import ClassVar

import pydantic
from mxcubecore import HardwareRepository as HWR
from mxcubecore.HardwareObjects.Beamline import Beamline

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    commands=["prepare_beamline_for_sample"],
    attributes=["data", "get_value"],
)


class BeamlineAdapter(ActuatorAdapterBase):
    """Adapter between Beamline route and Beamline hardware object."""

    SUPPORTED_TYPES: ClassVar[list[object]] = [Beamline]

    def __init__(self, ho, role, app):
        super().__init__(ho, role, app, resource_handler_config)
        self.app = app
        self.adapter_dict = {}

        workflow = self._ho.workflow
        if workflow:
            workflow.connect("parametersNeeded", self._wf_parameters_needed)

        gphl_workflow = self._ho.gphl_workflow
        if gphl_workflow:
            gphl_workflow.connect(
                "GphlJsonParametersNeeded", self._gphl_json_wf_parameters_needed
            )
            gphl_workflow.connect(
                "GphlUpdateUiParameters", self._gphl_json_wf_update_ui_parameters
            )

        from mxcubeweb.routes import signals

        if HWR.beamline.xrf_spectrum:
            HWR.beamline.xrf_spectrum.connect(
                HWR.beamline.xrf_spectrum,
                "xrf_task_progress",
                signals.xrf_task_progress,
            )

    def _wf_parameters_needed(self, params):
        self.app.server.emit("workflowParametersDialog", params, namespace="/hwr")

    def _gphl_json_wf_parameters_needed(self, schema, ui_schema):
        params = {}
        params["schema"] = schema
        params["ui_schema"] = ui_schema
        self.app.server.emit("gphlWorkflowParametersDialog", params, namespace="/hwr")

    def _gphl_json_wf_update_ui_parameters(self, update_dict):
        self.app.server.emit(
            "gphlWorkflowUpdateUiParametersDialog", update_dict, namespace="/hwr"
        )

    def _get_available_elements(self):
        escan = self._ho.energy_scan
        return escan.get_elements() if escan else []

    def get_value(self) -> dict:
        """Build dictionary value-representation for each beamline attribute.

        Returns:
            The dictionary.
        """
        attributes = {}

        for attr_name in self.app.mxcubecore.adapter_dict:
            # We skip the beamline attribute to avoid endless recursion
            if attr_name == "beamline":
                continue

            try:
                _d = self.app.mxcubecore.get_adapter(attr_name).data().dict()
            except pydantic.ValidationError:
                logging.getLogger("MX3.HWR").error(f"Incorrect values in {attr_name}")
                logging.getLogger("MX3.HWR").exception("")

            attributes.update({attr_name: _d})

        return {
            "energyScanElements": self._get_available_elements(),
            "path": HWR.beamline.session.get_base_image_directory(),
            "actionsList": [],
            "hardwareObjects": attributes,
        }

    def prepare_beamline_for_sample(self) -> dict:
        if hasattr(HWR.beamline.collect, "prepare_for_new_sample"):
            HWR.beamline.collect.prepare_for_new_sample()

        return {}
