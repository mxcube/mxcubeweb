from typing import ClassVar
import logging

from mxcubecore import HardwareRepository as HWR
from mxcubecore.HardwareObjects.abstract import AbstractDetector

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    name="detector_test",
    url_prefix="/mxcube/api/v0.1/detectortest",
    commands=["display_image"],
    attributes=["data", "get_detector_info"],
)


class DetectorAdapter(AdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [AbstractDetector.AbstractDetector]

    def __init__(self, ho, role, app):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        ho.connect("stateChanged", self._state_change)

    def _state_change(self, *args, **kwargs):
        self.state_change(*args, **kwargs)

    def state(self):
        return self._ho.get_state().name.upper()

    def get_detector_info(self) -> dict:
        """
        Retrieves file suffix from detector.

        Returns:
            File suffix.
        """

        filetype = HWR.beamline.detector.get_property("file_suffix", None)

        if filetype is None:
            filetype = "cbf"
            logging.getLogger("MX3.HWR").warning(
                "Detector file format not specified. Using cbf."
            )

        return {"fileSuffix": filetype}

    def display_image(self, image_path: str, image_num: str) -> dict:
        """
        Get the image path and image number to display in viewer.

        Args:
            image_path: Path to the image.
            image_num: Image number.
        Returns:
            Path and image number.
        """
        res = {"path": "", "img": 0}

        if image_path:
            fpath, img = HWR.beamline.detector.get_actual_file_path(
                image_path, image_num
            )
            HWR.beamline.collect.adxv_notify(fpath, img)
            fpath = HWR.beamline.session.get_path_with_proposal_as_root(fpath)

            res = {"path": fpath, "img_num": image_num}

        return res
