from mxcube3.core.adapter.adapter_base import ActuatorAdapterBase


class DetectorAdapter(ActuatorAdapterBase):
    def __init__(self, ho, name, **kwargs):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(DetectorAdapter, self).__init__(ho, name, **kwargs)
        ho.connect("statusChanged", self._state_change)

    def _set_value(self, value):
        pass

    def _state_change(self, *args, **kwargs):
        self.state_change(self.get_value(), **kwargs)

    def _get_value(self):
        return self.state()

    def limits(self):
        return []

    def stop(self):
        pass

    def state(self):
        return self._ho.state
