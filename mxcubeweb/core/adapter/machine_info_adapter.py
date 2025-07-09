from typing import ClassVar

from mxcubecore.BaseHardwareObjects import HardwareObjectState
from mxcubecore.HardwareObjects.abstract import AbstractMachineInfo

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import HOMachineInfoModel
from mxcubeweb.core.util.networkutils import RateLimited


class MachineInfoAdapter(ActuatorAdapterBase):
    """Adapter for MachineInfo like objects"""

    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractMachineInfo.AbstractMachineInfo]

    def __init__(self, ho, *args):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, *args)
        ho.connect("valueChanged", self._value_change)
        self._unique = True

    def _set_value(self, value=None):
        pass

    @RateLimited(0.1)
    def _value_change(self, *args, **kwargs):
        self.value_change(self.get_value().value, **kwargs)

    def get_value(self) -> HOMachineInfoModel:
        return HOMachineInfoModel(value=self.get_attributes())

    def get_attributes(self):
        """Read the information from the HO. Format the output."""
        value_dict = {"current": "-1 mA"}
        try:
            value_dict.update(self._ho.get_value())
            curr = value_dict.get("current")
            if isinstance(curr, float):
                value_dict.update({"current": f"{curr:3.2f} mA"})
        except (TypeError, AttributeError):
            pass
        return value_dict

    def limits(self):
        """
        Returns: The detector distance limits.
        """
        return (-1, -1)

    def stop(self):
        pass

    def state(self):
        return HardwareObjectState.READY.value

    def data(self) -> HOMachineInfoModel:
        return HOMachineInfoModel(**self._dict_repr())
