import logging
from typing import ClassVar

from mxcubecore.HardwareObjects.abstract import AbstractActuator, AbstractFlux

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    FloatValueModel,
    HOActuatorValueChangeModel,
)
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel
from mxcubeweb.core.util.networkutils import RateLimited

resource_handler_config = ResourceHandlerConfigModel(
    commands=["get_value", "set_value", "stop"], attributes=["data"]
)

hwr_logger = logging.getLogger("MX3.HWR")


class ActuatorAdapter(ActuatorAdapterBase):
    """
    Adapter for Energy Hardware Object, a web socket is used to communicate
    information on longer running processes.
    """

    SUPPORTED_TYPES: ClassVar[list[object]] = [
        AbstractActuator.AbstractActuator,
        AbstractFlux.AbstractFlux,
    ]

    def __init__(self, ho, role, app, resource_handler_config=resource_handler_config):
        """
        Args:
            ho (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        self._event_rate = 4

        @RateLimited(self._event_rate)
        def _vc(value, **kwargs):
            self.value_change(value, **kwargs)

        self._vc = _vc

        try:
            ho.connect("valueChanged", self._value_change)
            ho.connect("stateChanged", self.state_change)
        except Exception:
            msg = f"Could not connect to valueChanged or stateChanged: {ho.name}"
            hwr_logger.exception(msg)

    def _value_change(self, *args, **kwargs):
        self._vc(*args, **kwargs)

    def set_value(self, value: HOActuatorValueChangeModel) -> str:
        """
        Execute the sequence to set the value.
        Args:
            value (float): Target energy [keV].
        Returns:
            (float as str): The actual value set.
        Raises:
            ValueError: Value not valid or attemp to set a non-tunable energy.
            RuntimeError: Timeout while setting the value.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        self._ho.set_value(float(value.value))
        return self.get_value()

    def get_value(self) -> FloatValueModel:
        """
        Read the energy.
        Returns:
            (float as str): Energy [keV].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            return FloatValueModel(value=self._ho.get_value())
        except (AttributeError, TypeError):
            msg = "Could not get value"
            raise ValueError(msg)

    def stop(self):
        """
        Stop the execution.
        """
        self._ho.abort()

    def read_only(self):
        """
        Check if the energy is tunable or not.
        Retuns:
            (bool): True if tunable, False if not.
        """
        return self._ho.read_only
