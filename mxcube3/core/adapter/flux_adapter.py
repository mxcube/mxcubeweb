from decimal import Decimal

from mxcubecore.BaseHardwareObjects import HardwareObjectState

from mxcube3.core.adapter.adapter_base import ActuatorAdapterBase
from mxcube3.core import utils


class FluxAdapter(ActuatorAdapterBase):
    def __init__(self, ho, name, **kwargs):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(FluxAdapter, self).__init__(ho, name, **kwargs)

        self._read_only = ho.read_only
        import pdb

        pdb.set_trace()

        try:
            ho.connect("valueChanged", self._value_change)
        except BaseException:
            pass

    @utils.RateLimited(6)
    def _value_change(self, value, **kwargs):
        value = "{:.2E}".format(Decimal(self._ho.get_value()))
        self.value_change(value, **kwargs)

    def _set_value(self, value=None):
        """Read only"""

    def _get_value(self):
        """
        Get the photon flux.
        Returns:
            (float as str): Flux.
        """
        try:
            # value = self._ho.current_flux
            value = "{:.2E}".format(Decimal(self._ho.get_value()))
        except BaseException:
            value = "0"

        return value

    """
    def message(self):
        return ""
    """

    def limits(self):
        """No limits"""
        return (-1, -1)

    def state(self):
        """Always READY"""
        return HardwareObjectState.READY.name

    def _to_dict(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = {
            "value": self.get_value(),
            "limits": self.limits(),
            "precision": self.precision(),
        }

        return data
