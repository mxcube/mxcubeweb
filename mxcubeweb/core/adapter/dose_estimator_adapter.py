import logging
from typing import ClassVar

from flask import Flask, jsonify, make_response
from mxcubecore.HardwareObjects.DoseEstimator import (
    DoseEstimationError,
    DoseEstimator,
)

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.adaptermodels import HOModel
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

log = logging.getLogger("MX3.HWR")

resource_handler_config = ResourceHandlerConfigModel(
    commands=["estimate_dose_rate"],
    attributes=["data", "experimental_goals"],
)


class DoseEstimatorAdapter(AdapterBase):
    """Adapter for DoseEstimator hardware objects.

    Exposes dose rate estimation as a callable command and
    dose presets as a readable attribute.
    """

    SUPPORTED_TYPES: ClassVar[list[object]] = [DoseEstimator]

    def __init__(
        self,
        ho: DoseEstimator,
        role: str,
        app: Flask,
    ) -> None:
        super().__init__(ho, role, app, resource_handler_config)

    def estimate_dose_rate(
        self,
        energy_kev: float,
        transmission_pct: float,
    ) -> float:
        """Dose rate in MGy/s, or 422 if it can not be estimated."""
        try:
            return self._ho.estimate_dose_rate(energy_kev, transmission_pct)
        except DoseEstimationError as ex:
            # Valid request, but no estimate is possible for these inputs.
            # Only DoseEstimationError messages are meant for the user, other
            # exceptions end up as a generic 500 from the resource handler.
            log.exception("Dose rate estimation failed")
            return make_response(jsonify(msg=str(ex)), 422)

    # Plain `dict` return, type parametrization, i.e.
    # dict[str, ExperimentalGoal] would not pass as serialization
    # logic for adapter does not support these.
    def experimental_goals(self) -> dict:
        return self._ho.experimental_goals

    def data(self) -> HOModel:
        return HOModel(**self._dict_repr())
