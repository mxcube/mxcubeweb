from typing import ClassVar

from Argus import Argus

from mxcubeweb.core.adapter.adapter_base import AdapterBase


class ArgusAdapter(AdapterBase):
    ATTRIBUTES: ClassVar = ["processes_info", "last_response", "camera_streams"]
    SUPPORTED_TYPES: ClassVar[list[object]] = [Argus]

    def __init__(self, ho, *args):
        super().__init__(ho, *args)
        self.ho.connect("processesChanged", self.processes_changed)
        self.ho.connect("lastResponseChanged", self.last_response_changed)
        self.ho.connect("streamsChanged", self.streams_changed)

    def processes_info(self) -> dict:
        return self.ho.get_processes()

    def last_response(self) -> dict:
        return self.ho.get_last_response()

    def camera_streams(self) -> dict:
        return self.ho.get_streams()

    def processes_changed(self):
        processes = self.ho.get_processes()
        self.emit_ho_attribute_changed("processes_info", processes)

    def last_response_changed(self):
        last_response = self.ho.get_last_response()
        self.emit_ho_attribute_changed("last_response", last_response)

    def streams_changed(self):
        streams = self.ho.get_streams()
        self.emit_ho_attribute_changed("camera_streams", streams)
