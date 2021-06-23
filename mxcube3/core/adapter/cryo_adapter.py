from mxcubecore.BaseHardwareObjects import HardwareObjectState

from mxcube3.core.adapter.adapter_base import ActuatorAdapterBase
from mxcube3.core import utils


class CryoAdapter(ActuatorAdapterBase):
    def __init__(self, ho, name, **kwargs):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(CryoAdapter, self).__init__(ho, name, **kwargs)

        try:
            ho.connect("valueChanged", self._value_change)
            # ho.connect("stateChanged", self.state_change)
        except BaseException:
            pass

    @utils.RateLimited(1)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    """
    @utils.RateLimited(1)
    def _state_change(self, *args, **kwargs):
        self.state_change(*args, **kwargs)
    """

    def _set_value(self, value=None):
        """Read only"""

    def _get_value(self):
        """
        Get the cryostream temperature.
        Returns:
            (float as str): Temperature [deg K].
        """
        try:
            value = self._ho.get_value()
            value = round(float(value), self._precision)
        except (AttributeError, TypeError):
            value = 0.0

        value = ("{:3.%sf}" % self._precision).format(value)
        return value

    """
    def message(self):
        return ""
    """

    def limits(self):
        """No limits."""
        return ()

    def state(self):
        """Always READY"""
        return HardwareObjectState.READY.name
