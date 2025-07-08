from typing import ClassVar

from mxcubecore.HardwareObjects.abstract import AbstractMotor

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    FloatValueModel,
)
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel
from mxcubeweb.core.util.networkutils import RateLimited

resource_handler_config = ResourceHandlerConfigModel(
    url_prefix="/mxcube/api/v0.1/motor_test",
    commands=["set_value", "get_value", "stop"],
    attributes=["data"],
)


class MotorAdapter(ActuatorAdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractMotor.AbstractMotor]

    def __init__(self, ho, role, app):
        """
        Args:
            ho (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

    @RateLimited(10)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set_value(self, value: float):
        """
        Set the detector distance.
        Args:
            value (float): Target distance [mm].
        Returns:
            (str): The actual value set.
        Raises:
            ValueError: Value not valid.
            RuntimeError: Timeout while setting the value.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        self._ho.set_value(float(value))
        return self.get_value()

    def get_value(self) -> FloatValueModel:
        """
        Read the detector distance.
        Returns:
            (float as str): Detector distance [mm].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            value = self._ho.get_value()
        except (TypeError, AttributeError):
            value = 0.0

        return FloatValueModel(value=value)

    def state(self):
        """
        Get the state.
        Returns:
            (str): The state.
        """
        return self._ho.get_state().name

    def stop(self):
        self._ho.abort()

    def limits(self):
        """
        Read the detector distance limits.
        Returns:
            (tuple): Two floats (min, max).
        Raises:
            ValueError: When limits for any reason can't be retrieved.
        """
        try:
            return self._ho.get_limits()
        except (AttributeError, TypeError):
            msg = "Could not get limits"
            raise ValueError(msg)
