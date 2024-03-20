from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.util.networkutils import RateLimited

from mxcubeweb.core.models.adaptermodels import (
    HOActuatorValueChangeModel,
    FloatValueModel,
)


class MotorAdapter(ActuatorAdapterBase):
    def __init__(self, ho, *args):
        """
        Args:
            (object): Hardware object.
        """
        super(MotorAdapter, self).__init__(ho, *args)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

    @RateLimited(10)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def _set_value(self, value: HOActuatorValueChangeModel):
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
        self._ho.set_value(float(value.value))
        return self.get_value()

    def _get_value(self) -> FloatValueModel:
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

        return FloatValueModel(**{"value": value})

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
            raise ValueError("Could not get limits")
