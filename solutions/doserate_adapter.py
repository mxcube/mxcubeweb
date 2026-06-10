import logging
from typing import ClassVar

from mxcubecore.HardwareObjects.DoseRate import DoseRate

from mxcubeweb.core.adapter.actuator_adapter import ActuatorAdapter
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    commands=["set_value", "stop", "my_function"], attributes=["data", "get_value"]
)

hwr_logger = logging.getLogger("MX3.HWR")


class DoseRateAdapter(ActuatorAdapter):
    """Adapter for DoseRate Hardware Object.

    A web socket is used to communicate information on longer running processes.
    """

    SUPPORTED_TYPES: ClassVar[list[object]] = [
        DoseRate,
    ]

    def __init__(  # noqa: D417
        self,
        ho,
        role,
        app,
        resource_handler_config=resource_handler_config,
    ):
        """Initialize.

        Args:
            ho (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        self._type = "ACTUATOR"

    def my_function(self, arg1: int, arg2: int) -> str:
        """Example of a custom function that can be called from the frontend."""
        hwr_logger.info(f"Called my_function with arguments: {arg1}, {arg2}")
        # TODO: Implement the actual logic of the function here
        return f"Result of my_function with {arg1} and {arg2}"
