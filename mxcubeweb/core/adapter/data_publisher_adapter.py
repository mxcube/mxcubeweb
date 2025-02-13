import logging

from mxcubecore.BaseHardwareObjects import HardwareObjectState

from mxcubeweb.core.adapter.adapter_base import AdapterBase


class DataPublisherAdapter(AdapterBase):
    ATTRIBUTES = ["current_data", "all_data", "current"]

    def __init__(self, ho, *args):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, *args)
        self._all_data_list = []
        self._current_data_list = []
        self._current_info = {}

        try:
            ho.connect("data", self._new_data_handler)
            ho.connect("start", self._start_handler)
            ho.connect("end", self._end_handler)
        except Exception:
            msg = "Could not initialize DataPublisherAdapter"
            logging.getLogger("MX3.HWR").exception(msg)
        else:
            self._available = True

    def _new_data_handler(self, data):
        self._current_data_list.append(data["data"])
        self.emit_ho_attribute_changed(
            "current_data", [data["data"]], operation="UPDATE"
        )

    def _start_handler(self, data):
        self._current_info = data
        self.emit_ho_changed()

    def _end_handler(self, data):
        self._all_data_list.append(data)
        self.emit_ho_changed()

    def state(self):
        return HardwareObjectState.READY.name

    def current_data(self) -> list:
        return self._current_data_list

    def current(self) -> dict:
        return self._current_info

    def all_data(self) -> list:
        return self._all_data_list
