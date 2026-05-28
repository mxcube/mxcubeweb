from typing import ClassVar

from mxcubecore import HardwareRepository as HWR
from mxcubecore.HardwareObjects.abstract import AbstractDetector
from pydantic import BaseModel, Field, FilePath

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    commands=["display_image"],
    attributes=["data", "get_value"],
)


class DisplayImageParams(BaseModel):
    path: FilePath = Field(description="Path to images' masterfile")
    img_num: int = Field(description="Index of the image to display")


class DetectorAdapter(AdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractDetector.AbstractDetector]

    def __init__(self, ho, role, app):  # noqa: D417
        """Initialize.

        Args:
            ho (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        ho.connect("stateChanged", self._state_change)

    def get_value(self) -> dict:
        """Get the file suffix of the data files."""
        return {"fileSuffix": HWR.beamline.detector.get_property("file_suffix", "?")}

    def _state_change(self, *args, **kwargs):
        self.state_change(*args, **kwargs)

    def state(self):
        return self._ho.get_state().name.upper()

    def display_image(self, params: DisplayImageParams) -> dict:
        """Notify ADXV and/or Braggy of the image to display."""
        res = {"image_url": ""}
        path, img_num = str(params.path), params.img_num

        if path:
            fpath, img = HWR.beamline.detector.get_actual_file_path(path, img_num)
            HWR.beamline.collect.display_image(fpath, img)
            fpath = HWR.beamline.session.get_path_with_proposal_as_root(fpath)

            if self.app.CONFIG.braggy is not None and self.app.CONFIG.braggy.USE_BRAGGY:
                res = {
                    "image_url": (
                        f"{self.app.CONFIG.braggy.BRAGGY_URL}/"
                        f"?file={fpath}/image_${img_num}.h5.dataset"
                    )
                }

        return res
