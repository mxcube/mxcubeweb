from typing import ClassVar

from flask import Flask
from mxcubecore.HardwareObjects.abstract.AbstractDoseEstimator import (
    AbstractDoseEstimator,
    DoseEstimateParameters,
    DoseEstimation,
)

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.adaptermodels import HOModel
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    commands=["estimate_dose"],
    attributes=["data", "experimental_goals"],
)


class DoseEstimatorAdapter(AdapterBase):
    """Adapter for AbstractDoseEstimator hardware objects.

    Exposes dose estimation as a callable command and
    dose presets as a readable attribute.
    """

    ATTRIBUTES: ClassVar[list[str]] = ["experimental_goals"]
    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractDoseEstimator]

    def __init__(
        self,
        ho: AbstractDoseEstimator,
        role: str,
        app: Flask,
    ) -> None:
        self._type = "DOSEESTIMATOR"
        super().__init__(ho, role, app, resource_handler_config)

    def estimate_dose(
        self,
        params: DoseEstimateParameters,
    ) -> DoseEstimation:
        return self._ho.estimate_dose(params)

    # Plain `dict` return, type parametrization, i.e.
    # dict[str, ExperimentalGoal] would not pass as serialization
    # logic for adapter does not support these.
    def experimental_goals(self) -> dict:
        return self._ho.experimental_goals

    def data(self) -> HOModel:
        return HOModel(**self._dict_repr())
