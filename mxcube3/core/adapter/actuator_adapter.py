import logging

from mxcube3.core.adapter.adapter_base import ActuatorAdapterBase
from mxcube3.core import utils


class ActuatorAdapter(ActuatorAdapterBase):
    """
    Adapter for Energy Hardware Object, a web socket is used to communicate
    information on longer running processes.
    """

    def __init__(self, ho, name, **kwargs):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(ActuatorAdapter, self).__init__(ho, name, **kwargs)
        self._event_rate = 4
        self._precision = 4

        try:
            ho.connect("valueChanged", self._value_change)
            ho.connect("stateChanged", self.state_change)
        except BaseException:
            pass

    def _value_change(self, *args, **kwargs):
        @utils.RateLimited(self._event_rate)
        def _vc(value, **kwargs):
            if self._precision:
                value = round(float(value), self._precision)

            self.value_change(value, **kwargs)

        _vc(*args, **kwargs)

    def _set_value(self, value):
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
        try:
            self._ho.set_value(float(value))
            return self.get_value()
        except BaseException:
            raise

    def _get_value(self):
        """
        Read the energy.
        Returns:
            (float as str): Energy [keV].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            value = self._ho.get_value()

            if self._precision:
                value = round(float(value), self._precision)
                value = ("{:3.%sf}" % self._precision).format(value)

            return value
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

    def state(self):
        """
        Get the state.
        Returns:
            (str): The state.
        """
        # The state is an enum, return the name only
        return self._ho.get_state().name

    def stop(self):
        """
        Stop the execution.
        """
        self._ho.abort()

    def limits(self):
        """
        Read the energy limits.
        Returns:
            (tuple): Two floats (min, max).
        Raises:
            ValueError: When limits for any reason can't be retrieved.
        """
        try:
            # Limits are None when not configured, convert them to -1, -1
            # as we are returning floats
            return (-1, -1) if None in self._ho.get_limits() else self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

    def read_only(self):
        """
        Check if the energy is tunable or not.
        Retuns:
            (bool): True if tunable, False if not.
        """
        return self._ho.read_only
