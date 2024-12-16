import contextlib
from decimal import Decimal
from typing import ClassVar

from mxcubecore.BaseHardwareObjects import HardwareObjectState
from mxcubecore.HardwareObjects.abstract import AbstractFlux

from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    FloatValueModel,
)
from mxcubeweb.core.util.networkutils import RateLimited


class FluxAdapter(ActuatorAdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractFlux.AbstractFlux]

    def __init__(self, ho, *args, **kwargs):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, *args, **kwargs)

        self._read_only = ho.read_only

        with contextlib.suppress(Exception):
            ho.connect("valueChanged", self._value_change)

    @RateLimited(6)
    def _value_change(self, value, **kwargs):
        value = "{:.2E}".format(Decimal(self._ho.get_value()))
        self.value_change(value, **kwargs)

    def set_value(self, value=None):
        """Read only"""

    def get_value(self) -> FloatValueModel:
        """
        Get the photon flux.
        Returns:
            (float as str): Flux.
        """
        try:
            # value = self._ho.current_flux
            value = "{:.2E}".format(Decimal(self._ho.get_value()))
        except Exception:
            value = "0"

        return FloatValueModel(value=value)

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
