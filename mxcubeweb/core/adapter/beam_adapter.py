from typing import ClassVar

from mxcubecore.HardwareObjects.abstract import AbstractBeam

from mxcubeweb.core.adapter.adapter_base import (
    ActuatorAdapterBase,
    default_resource_handler_config,
)
from mxcubeweb.core.models.adaptermodels import (
    HOBeamModel,
    HOBeamValueModel,
)


class BeamAdapter(ActuatorAdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractBeam.AbstractBeam]

    def __init__(self, ho, role, app):
        super().__init__(ho, role, app, default_resource_handler_config)

        for sig in [
            "beamPosChanged",
            "beamInfoChanged",
            "valueChanged",
            "stateChanged",
        ]:
            ho.connect(ho, sig, self._beam_changed)

    def _beam_changed(self, *args, **kwargs):  # noqa: ARG002
        """
        Callback method for beam position and info changes.
        """
        self.app.server.emit(
            "beam_changed", {"data": self.get_value().dict()["value"]}, namespace="/hwr"
        )

    def limits(self):
        return -1, -1

    def _get_aperture(self) -> tuple:
        """
        Returns list of apertures and the one currently used.

        :return: Tuple, (list of apertures, current aperture)
        :rtype: tuple
        """
        beam_ho = self._ho

        aperture_list = beam_ho.get_available_size()["values"]
        current_aperture = beam_ho.get_value()[-1]

        return aperture_list, current_aperture

    def get_value(self) -> HOBeamValueModel:
        beam_info_dict = {
            "position": [],
            "shape": "",
            "size_x": 0,
            "size_y": 0,
        }
        sx, sy, shape, _label = self._ho.get_value()

        beam_info_dict.update(
            {
                "position": self._ho.get_beam_position_on_screen(),
                "size_x": sx,
                "size_y": sy,
                "shape": shape.value,
            }
        )

        aperture_list, current_aperture = self._get_aperture()

        beam_info_dict.update(
            {
                "apertureList": aperture_list,
                "currentAperture": current_aperture,
            }
        )

        return HOBeamValueModel(value=beam_info_dict)

    def get_size(self) -> HOBeamModel:
        pass

    def set_size(self, value: HOBeamModel) -> HOBeamModel:
        pass

    def data(self) -> HOBeamModel:
        return HOBeamModel(**self._dict_repr())
