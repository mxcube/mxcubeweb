from typing import ClassVar

from mxcubecore.HardwareObjects.abstract import AbstractDetector

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    name="detector_test",
    url_prefix="/mxcube/api/v0.1/detectortest",
    attributes=["data"],
)


class DetectorAdapter(AdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractDetector.AbstractDetector]

    def __init__(self, ho, role, app):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        ho.connect("stateChanged", self._state_change)

    def _state_change(self, *args, **kwargs):
        self.state_change(*args, **kwargs)

    def state(self):
        return self._ho.get_state().name.upper()
