from mxcubeweb.core.adapter.adapter_base import ActuatorAdapterBase
from mxcubeweb.core.util.adapterutils import export
from mxcubeweb.core.util.networkutils import RateLimited

from mxcubeweb.core.models.adaptermodels import (
    HOActuatorValueChangeModel,
    FloatValueModel,
)


class ActuatorAdapter(ActuatorAdapterBase):
    """
    Adapter for Energy Hardware Object, a web socket is used to communicate
    information on longer running processes.
    """

    def __init__(self, ho, *args):
        """
        Args:
            (object): Hardware object.
        """
        super(ActuatorAdapter, self).__init__(ho, *args)
        self._event_rate = 4

        @RateLimited(self._event_rate)
        def _vc(value, **kwargs):
            self.value_change(value, **kwargs)

        self._vc = _vc

        try:
            ho.connect("valueChanged", self._value_change)
            ho.connect("stateChanged", self.state_change)
        except Exception:
            pass

    def _value_change(self, *args, **kwargs):
        self._vc(*args, **kwargs)

    def _set_value(self, value: HOActuatorValueChangeModel):
        """
        Execute the sequence to set the value.
        Args:
            value (float): Target energy [keV].
        Returns:
            (float as str): The actual value set.
        Raises:
            ValueError: Value not valid or attemp to set a non-tunable energy.
            RuntimeError: Timeout while setting the value.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        try:
            self._ho.set_value(float(value.value))
        except Exception:
            raise

    @export
    def _get_value(self) -> FloatValueModel:
        """
        Read the energy.
        Returns:
            (float as str): Energy [keV].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            return FloatValueModel(**{"value": self._ho.get_value()})
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

    def stop(self):
        """
        Stop the execution.
        """
        self._ho.abort()

    def read_only(self):
        """
        Check if the energy is tunable or not.
        Retuns:
            (bool): True if tunable, False if not.
        """
        return self._ho.read_only
