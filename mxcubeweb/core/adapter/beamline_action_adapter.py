import logging

from enum import Enum

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    NStateModel,
    HOActuatorValueChangeModel,
    StrValueModel,
)


class BeamlineActionAdapter(ActuatorAdapterBase):
    def __init__(self, ho, *args, **kwargs):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, *args, **kwargs)
        self._value_change_model = HOActuatorValueChangeModel

        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

    def _value_change(self, value):
        if isinstance(value, Enum):
            v = value.name
        else:
            v = value

        self.value_change(v)

    def commands(self):
        method_list = [
            attribute
            for attribute in dir(self._ho.__class__)
            if callable(getattr(self._ho.__class__, attribute))
            and attribute.startswith("_") is False
        ]

        return method_list

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
