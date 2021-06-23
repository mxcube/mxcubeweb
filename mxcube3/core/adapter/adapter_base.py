import math
import logging

from mxcube3.core.models import HOModel, HOActuatorModel

class AdapterBase:
    """Hardware Object Adapter Base class"""

    def __init__(self, ho, name, app=None, **kwargs):
        """
        Args:
            (object): Hardware object to mediate for.
            (str): The name of the object
        """
        self._application = app
        self._ho = ho
        self._name = name
        self._available = True
        self._read_only = False
        self._type = "FLOAT"

    @property
    def ho(self):
        """
        Underlaying HardwareObject
        Returns:
            (object): HardwareObject
        """
        return self._ho

    # Abstract method
    def state(self):
        """
        Retrieves the state of the underlying hardware object and converts it to a str
        that can be used by the javascript front end.
        Returns:
            (str): The state
        """
        return ""

    # Abstract method
    def msg(self):
        """
        Returns a message describing the current state. should be used to communicate 
        details of the state to the user.
        Returns:
            (str): The message string.
        """
        return ""

    def read_only(self):
        """
        Returns true if the hardware object is read only, set_value can not be called
        Returns:
            (bool): True if read enly.
        """
        return self._read_only

    def available(self):
        """
        Check if the hardware object is considered to be available/online/enbled
        Returns:
            (bool): True if available.
        """
        return self._available

    def state_change(self, *args, **kwargs):
        """
        Signal handler to be used for sending the state to the client via
        socketIO
        """
        self._application.server.emit("beamline_value_change", self.dict(), namespace="/hwr")

    def _dict_repr(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        try:
            data = {
                "name": self._name,
                "label": self._name.replace("_", " ").title(),
                "state": self.state(),
                "msg": self.msg(),
                "type": self._type,
                "available": self.available(),
                "readonly": self.read_only(),
                "commands": (),
            }

        except Exception as ex:
            # Return a default representation if there is a problem retrieving
            # any of the attributes
            self._available = False

            data = {
                "name": self._name,
                "label": self._name.replace("_", " ").title(),
                "state": "UNKNOWN",
                "msg": "Exception: %s" % str(ex),
                "type": "FLOAT",
                "available": self.available(),
                "readonly": False,
            }

            logging.getLogger("MX3.HWR").exception(
                f"Failed to get dictionary representation of {self._name}"
            )

        return data

    def data(self):
        return HOModel(**self._dict_repr())

    def dict(self):
        return self.data().dict()


class ActuatorAdapterBase(AdapterBase):
    def __init__(self, ho, name, precision=1, **kwargs):
        """
        Args:
            (object): Hardware object to mediate for.
            (str): The name of the object.
        """
        super(ActuatorAdapterBase, self).__init__(ho, name, **kwargs)
        self._STATES = None
        self._precision = precision

    # Dont't limit rate this method with utils.LimitRate, all sub-classes
    # will share this method thus all methods will be effected if limit rated.
    # Rather LimitRate the function calling this one.
    def value_change(self, *args, **kwargs):
        """
        Signal handler to be used for sending values to the client via
        socketIO.
        """
        data = {"name": self._name, "value": args[0]}
        self._application.server.emit("beamline_value_change", data, namespace="/hwr")

    def precision(self):
        """Display precision.
        Returns:
            (int): Number of digits to be displayed.
        """
        return self._precision

    def step_size(self):
        return math.pow(10, -self._precision)

    # Abstract method
    def set_value(self, value):
        """
        Sets a value on underlying hardware object.
        Args:
            value(float): Value to be set.
        Returns:
            (str): The actual value, after being set.
        Raises:
            ValueError: When conversion or treatment of value fails.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        try:
            self._set_value(value)
            data = self.dict()
        except ValueError as ex:
            self._available = False
            data = self.dict()
            data["state"] = "UNUSABLE"
            data["msg"] = str(ex)
            logging.getLogger("MX3.HWR").error("Error setting bl attribute: " + str(ex))

        return data

    # Abstract method
    def get_value(self):
        """
        Retrieve value from underlying hardware object.
        Returns:
            (str): The value.
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        return self._get_value()

    # Abstract method
    def stop(self):
        """
        Stop an action/movement.
        """

    # Abstract method
    def limits(self):
        """ Get the limits and default stepsize of the device.
        Returns:
            (tuple): Three values tuple (min, max, step).
        """
        return (0, 1)

    def _dict_repr(self):
        """Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = super(ActuatorAdapterBase, self)._dict_repr()

        try:
            data.update(
                {
                    "value": self.get_value(),
                    "limits": self.limits(),
                    "precision": self.precision(),
                    "step": self.step_size(),
                }
            )
        except Exception as ex:
            self._available = False
            data.update(
                {
                    "value": 0,
                    "limits": (0, 0),
                    "type": "FLOAT",
                    "precision": 0,
                    "step": 0,
                    "msg": "Exception %s" % str(ex),
                }
            )

        return data

    def data(self):
        return HOActuatorModel(**self._dict_repr())