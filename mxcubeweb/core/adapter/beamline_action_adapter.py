import logging
from enum import Enum
from typing import ClassVar

from mxcubecore.BaseHardwareObjects import HardwareObject
from mxcubecore.HardwareObjects.BeamlineActions import BeamlineActions

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.adaptermodels import (
    HOActuatorValueChangeModel,
    NStateModel,
)
from mxcubeweb.core.models.configmodels import AdapterResourceHandlerConfigModel

resource_handler_config = AdapterResourceHandlerConfigModel(
    commands=["stop"], attributes=["data"]
)


class BeamlineActionAdapter(AdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [BeamlineActions]

    def __init__(
        self,
        ho: HardwareObject,
        role: str,
        app,
        resource_handler_config: AdapterResourceHandlerConfigModel = resource_handler_config,  # noqa: E501
    ):
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

    def commands(self):
        return [
            attribute
            for attribute in dir(self._ho.__class__)
            if callable(getattr(self._ho.__class__, attribute))
            and attribute.startswith("_") is False
        ]

    def msg(self):
        try:
            msg = self._ho.get_value().name
        except Exception:
            msg = "---"
            logging.getLogger("MX3.HWR").error(
                "Failed to get beamline attribute message"
            )

        return msg

    def stop(self):
        """
        Stop the execution.
        """
        for cmd in self._ho.get_commands():
            self._ho.abort_command(cmd.name())

    def data(self) -> NStateModel:
        return NStateModel(**self._dict_repr())
