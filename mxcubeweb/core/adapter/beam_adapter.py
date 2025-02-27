from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    HOBeamModel,
    HOBeamValueModel,
)
from mxcubeweb.core.util.adapterutils import export


class BeamAdapter(ActuatorAdapterBase):
    def __init__(self, ho, *args):
        super().__init__(ho, *args)

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

    def _get_value(self) -> HOBeamValueModel:
        beam_ho = self._ho

        beam_info_dict = {
            "position": [],
            "shape": "",
            "size_x": 0,
            "size_y": 0,
        }
        sx, sy, shape, _label = beam_ho.get_value()

        if beam_ho is not None:
            beam_info_dict.update(
                {
                    "position": beam_ho.get_beam_position_on_screen(),
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

    @export
    def get_size(self) -> HOBeamModel:
        pass

    @export
    def set_size(self, value: HOBeamModel) -> HOBeamModel:
        pass

    def data(self) -> HOBeamModel:
        return HOBeamModel(**self._dict_repr())
