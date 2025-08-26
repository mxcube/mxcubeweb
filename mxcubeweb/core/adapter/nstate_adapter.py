import logging
from enum import Enum
from typing import ClassVar

from mxcubecore.HardwareObjects.abstract import (
    AbstractNState,
    AbstractShutter,
)

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    HOActuatorValueChangeModel,
    NStateModel,
    StrValueModel,
)
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    commands=["get_value", "set_value", "stop"], attributes=["data"]
)


class NStateAdapter(ActuatorAdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [
        AbstractNState.AbstractNState,
        AbstractShutter.AbstractShutter,
    ]

    def __init__(self, ho, role, app):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        self._value_change_model = HOActuatorValueChangeModel

        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

    def _value_change(self, value):
        v = value.name if isinstance(value, Enum) else value

        self.value_change(v)

    def _get_valid_states(self):
        state_names = [v.name for v in self._ho.VALUES]
        if "UNKNOWN" in state_names:
            state_names.remove("UNKNOWN")

        return state_names

    def _get_available_states(self):
        state_names = self._get_valid_states()
        state_names.remove(self._ho.get_value().name)

        return state_names

    def commands(self):
        return self._get_valid_states()

    def set_value(self, value: HOActuatorValueChangeModel) -> str:
        """
        Sets value of the Nstate adapter.

        Args:
            value (Enum): value to be set containing name and value attributes.
        Returns:
            (str): The actual value set as a string.
        Raises:
            ValueError: Value not valid.
            RuntimeError: Timeout while setting the value.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        self._ho.set_value(self._ho.VALUES[value.value])
        return self.get_value()

    def get_value(self) -> StrValueModel:
        return StrValueModel(value=self._ho.get_value().name)

    def stop(self):
        """
        Stop the execution.
        """
        self._ho.abort()

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
