from typing import ClassVar

from Argus import Argus

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    attributes=[
        "stream_proxy_url",
        "processes_info",
        "last_response",
        "camera_streams",
        "main_camera_stream",
        "get_value",
    ]
)


class ArgusAdapter(AdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [Argus]

    def __init__(self, ho, role, app):
        super().__init__(ho, role, app, resource_handler_config)
        self.ho.connect("processesChanged", self.processes_changed)
        self.ho.connect("lastResponseChanged", self.last_response_changed)
        self.ho.connect("streamsChanged", self.streams_changed)

    def processes_info(self) -> dict:
        return self.ho.get_processes()

    def last_response(self) -> dict:
        return self.ho.get_last_response()

    def camera_streams(self) -> dict:
        return self.ho.get_streams()

    def stream_proxy_url(self) -> str:
        return self.app.CONFIG.argus.STREAM_PROXY_URL

    def main_camera_stream(self) -> str:
        return self.ho.get_main_camera_stream().rstrip("/")

    def get_value(self):
        return {
            "stream_proxy_url": self.stream_proxy_url(),
            "main_camera_stream": self.main_camera_stream(),
            "multi_views": self.ho.get_multi_views(),
        }

    def processes_changed(self):
        processes = self.ho.get_processes()
        self.emit_ho_attribute_changed("processes_info", processes)

    def last_response_changed(self):
        last_response = self.ho.get_last_response()
        self.emit_ho_attribute_changed("last_response", last_response)

    def streams_changed(self):
        streams = self.ho.get_streams()
        self.emit_ho_attribute_changed("camera_streams", streams)
