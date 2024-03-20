from mxcubeweb.core.adapter.actuator_adapter import ActuatorAdapter
from mxcubeweb.core.adapter.wavelength_adapter import WavelengthAdapter


class EnergyAdapter(ActuatorAdapter):
    """
    Adapter for Energy Hardware Object, a web socket is used to communicate
    information on longer running processes.
    """

    def __init__(self, *args):
        """
        Args:
            (object): Hardware object.
        """
        super(EnergyAdapter, self).__init__(*args)
        self._add_adapter("wavelength", self._ho, WavelengthAdapter)
        self._type = "MOTOR"
