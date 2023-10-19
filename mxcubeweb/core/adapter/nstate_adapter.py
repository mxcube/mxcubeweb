from enum import Enum
import logging

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    NStateModel,
    HOActuatorValueChangeModel,
    StrValueModel,
)


class NStateAdapter(ActuatorAdapterBase):
    def __init__(self, ho, *args, **kwargs):
        """
        Args:
            (object): Hardware object.
        """
        super(NStateAdapter, self).__init__(ho, *args, **kwargs)
        self._value_change_model = HOActuatorValueChangeModel

        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

    def _value_change(self, value):
        if isinstance(value, Enum):
            v = value.name
        else:
            v = value

        self.value_change(v)

    def _get_valid_states(self):
        state_names = [v.name for v in self._ho.VALUES]
        state_names.remove("UNKNOWN")

        return state_names

    def _get_available_states(self):
        state_names = self._get_valid_states()
        state_names.remove(self._ho.get_value().name)

        return state_names

    def commands(self):
        return self._get_valid_states()

    def _set_value(self, value: HOActuatorValueChangeModel):
        self._ho.set_value(self._ho.VALUES[value.value])

    def _get_value(self) -> StrValueModel:
        return StrValueModel(**{"value": self._ho.get_value().name})

    def msg(self):
        try:
            msg = self._ho.get_value().name
        except Exception:
            msg = "---"
            logging.getLogger("MX3.HWR").error(
                "Failed to get beamline attribute message"
            )

        return msg

    def data(self) -> NStateModel:
        return NStateModel(**self._dict_repr())
