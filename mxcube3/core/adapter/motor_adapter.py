from mxcube3.core.adapter.adapter_base import ActuatorAdapterBase
from mxcube3.core import utils


class MotorAdapter(ActuatorAdapterBase):
    def __init__(self, ho, name, **kwargs):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(MotorAdapter, self).__init__(ho, name, **kwargs)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def _set_value(self, value):
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
        self._ho.set_value(round(float(value), self._precision))
        return self.get_value()

    def _get_value(self):
        """
        Read the detector distance.
        Returns:
            (float as str): Detector distance [mm].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            value = self._ho.get_value()
            value = round(float(value), self._precision)
        except (TypeError, AttributeError):
            value = 0.0

        value = ("{:4.%sf}" % self._precision).format(value)
        return value

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
