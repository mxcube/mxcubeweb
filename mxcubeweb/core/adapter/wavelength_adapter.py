from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.models.adaptermodels import (
    FloatValueModel,
    HOActuatorValueChangeModel,
)
from mxcubeweb.core.util.networkutils import RateLimited


class WavelengthAdapter(ActuatorAdapterBase):
    """
    Adapter for wavelength Hardware Object, a web socket is used communicate
    information on longer running processes.
    """

    def __init__(self, ho, *args):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, *args)
        self._type = "MOTOR"

        try:
            ho.connect("energyChanged", self._value_change)
            ho.connect("stateChanged", self.state_change)
        except Exception:
            pass

    @RateLimited(6)
    def _value_change(self, pos, wl, *args, **kwargs):
        self.value_change(wl)

    def _set_value(self, value: HOActuatorValueChangeModel):
        """
        Execute the sequence to set the value.
        Args:
            value (float): Target wavelength [Å].
        Returns:
            (float as str): The actual value set.
        Raises:
            ValueError: Value not valid or attemp to set read only value.
            RuntimeError: Timeout while setting the value.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        try:
            self._ho.set_wavelength(float(value.value))
            return self.get_value()
        except Exception:
            raise

    def _get_value(self) -> FloatValueModel:
        """
        Read the wavelength value.
        Returns:
            (float as str): Wavelength [Å].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            return FloatValueModel(value=self._ho.get_wavelength())
        except (AttributeError, TypeError) as ex:
            msg = "Could not get value"
            raise ValueError(msg) from ex

    def state(self):
        """
        Get the state.
        Returns:
            (str): The state
        """
        # The state is an enum, return the name only
        return self._ho.get_state().name

    def stop(self):
        """
        Stop the execution.
        """
        self._ho.abort()

    def limits(self):
        """
        Read the wavelengt limits.
        Returns:
            (tuple): Two floats (min, max) limits.
        Raises:
            ValueError: When limits for any reason can't be retrieved.
        """
        try:
            return self._ho.get_wavelength_limits()
        except (AttributeError, TypeError) as ex:
            msg = "Could not get limits"
            raise ValueError(msg) from ex

    def read_only(self):
        """
        Check if the wavelength is read only or not.
        Retuns:
            (bool): True if read only, False if not.
        """
        return self._ho.read_only
