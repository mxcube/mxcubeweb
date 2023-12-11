import inspect
import traceback
import typing
import logging

import pydantic
import gevent

from typing import Any

from mxcubeweb.core.util.adapterutils import (
    get_adapter_cls_from_hardware_object,
)
from mxcubeweb.core.models.adaptermodels import HOModel, HOActuatorModel


class AdapterBase:
    """Hardware Object Adapter Base class"""

    ATTRIBUTES = []
    METHODS = []

    def __init__(self, ho, role, app):
        """
        Args:
            (object): Hardware object to mediate for.
            (str): The name of the object
        """
        self.app = app
        self._ho = ho
        self._name = role
        self._available = True
        self._read_only = False
        self._type = type(self).__name__.replace("Adapter", "").upper()
        self._unique = True
        self._msg = ""

    def get_adapter_id(self, ho=None):
        ho = self._ho if not ho else ho
        return self.app.mxcubecore._get_adapter_id(ho)

    def _add_adapter(self, attr_name, ho, adapter_cls=None):
        adapter_cls = (
            adapter_cls if adapter_cls else get_adapter_cls_from_hardware_object(ho)
        )

        _id = f"{self.get_adapter_id()}.{attr_name}"
        adapter_instance = adapter_cls(ho, _id, self.app)
        self.app.mxcubecore._add_adapter(_id, adapter_cls, ho, adapter_instance)

        setattr(self, attr_name, adapter_instance)

    def _set_value(self):
        pass

    def _get_value(self):
        pass

    def execute_command(self, cmd_name, args):
        try:
            self._pydantic_model_for_command(cmd_name).validate(args)
        except pydantic.ValidationError:
            logging.getLogger("MX3.HWR").exception(
                f"Error when validating input {args} for command {cmd_name}"
            )

        task = gevent.spawn(self._execute_command, cmd_name, args)
        task.call_args = {"cmd_name": cmd_name, "value": args}
        task.link_value(self._command_success)

    def _execute_command(self, cmd_name, args):
        _cmd = getattr(self, cmd_name, None)
        logging.getLogger("MX3.HWR").info(
            f"Calling {self._name}.{cmd_name} with {args}"
        )

        try:
            if _cmd:
                return _cmd(**args)
            else:
                return self._ho.execute_exported_command(cmd_name, args)
        except Exception as ex:
            self._command_exception(cmd_name, ex)
            logging.getLogger("MX3.HWR").exception("")

    def _command_success(self, t):
        value = t.value
        cmd_name = t.call_args["cmd_name"]
        attr = getattr(self._ho, cmd_name)
        model = self._model_from_typehint(attr)

        try:
            model["return"].validate({"return": value})
        except pydantic.ValidationError:
            attr_name = t.call_args["cmd_name"]
            logging.getLogger("MX3.HWR").exception(
                f"Return value of {self._name}.{attr_name} is of wrong type"
            )
        else:
            logging.getLogger("MX3.HWR").info(
                f"{self._name}.{cmd_name} returned {value}"
            )
            if value:
                self._msg = value
            self.app.server.emit(
                "hardware_object_command_return",
                {"cmd_name": cmd_name, "value": value},
                namespace="/hwr",
            )

            self.emit_ho_changed(self.state())

    def _command_exception(self, cmd_name, ex):
        self._msg = traceback.format_exc()
        self.app.server.emit(
            "hardware_object_command_error",
            {"cmd_name": cmd_name, "value": str(ex)},
            namespace="/hwr",
        )
        self.emit_ho_changed(self.state())

    @property
    def adapter_type(self):
        """
        Returns:
            (str): The data type of the value
        """
        return self._type

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
        return self._ho.get_state().name

    # Abstract method
    def msg(self):
        """
        Returns a message describing the current state. should be used to communicate
        details of the state to the user.
        Returns:
            (str): The message string.
        """
        return self._msg

    def read_only(self):
        """
        Returns true if the hardware object is read only, set_value can not be called
        Returns:
            (bool): True if read enly.
        """
        return self._read_only

    def available(self):
        """
        Check if the hardware object is considered to be available/online/enabled
        Returns:
            (bool): True if available.
        """
        return self._available

    def _model_from_typehint(self, attr):
        input_dict = {}
        output_dict = {}

        for _n, _t in typing.get_type_hints(attr).items():
            if _n != "return":
                input_dict[_n] = (_t, pydantic.Field(alias=_n))
            else:
                if not inspect.isclass(_t):
                    _t = _t.__class__

                output_dict[_n] = (_t, pydantic.Field(alias=_n))

        return {
            "args": pydantic.create_model(attr.__name__, **input_dict),
            "return": pydantic.create_model(attr.__name__, **output_dict),
            "signature": list(input_dict.keys()),
        }

    def _pydantic_model_for_command(self, cmd_name):
        if cmd_name in self.METHODS:
            return self._model_from_typehint(getattr(self, cmd_name, None))["args"]
        else:
            return self._ho.pydantic_model[cmd_name]

    def _exported_methods(self):
        exported_methods = {}

        # Get exported attributes from underlaying HardwareObject
        if self._ho.exported_attributes:
            exported_methods = self._ho.exported_attributes

        for method_name in self.METHODS:
            attr = getattr(self, method_name, None)

            if attr:
                model = self._model_from_typehint(attr)
                exported_methods[method_name] = {
                    "signature": model["signature"],
                    "schema": model["args"].schema_json(),
                    "display": False,
                }

        return exported_methods

    def commands(self):
        return self._exported_methods()

    def attributes(self):
        _attributes = {}

        for attribute_name in self.ATTRIBUTES:
            attr = getattr(self, attribute_name, None)

            if attr:
                model = self._model_from_typehint(attr)
                value = attr()

                try:
                    model["return"].validate({"return": value})
                except pydantic.ValidationError:
                    logging.getLogger("MX3.HWR").exception(
                        "Return value of"
                        f" {self._name}.{attribute_name} is of wrong"
                        " type"
                    )
                    _attributes[attribute_name] = {}
                else:
                    _attributes[attribute_name] = attr()

        return _attributes

    def emit_ho_attribute_changed(
        self, attribute: str, value: Any, operation: str = "SET"
    ):
        self.app.server.emit(
            "hardware_object_attribute_changed",
            {
                "name": self._name,
                "attribute": attribute,
                "value": value,
                "operation": operation.upper(),
            },
            namespace="/hwr",
        )

    def emit_ho_value_changed(self, value: Any):
        self.app.server.emit(
            "hardware_object_value_changed",
            {"name": self._name, "value": value},
            namespace="/hwr",
        )

    def emit_ho_changed(self, state, **kwargs):
        """
        Signal handler to be used for sending the entire object to the client via
        socketIO
        """
        data = self.dict()

        if hasattr(state, "name"):
            data["state"] = state.name
        else:
            logging.getLogger("MX3.HWR").info(
                f"emit_ho_changed with {state} for {self._ho.name()}"
            )

        self.app.server.emit("hardware_object_changed", data, namespace="/hwr")

    def state_change(self, state, **kwargs):
        """
        Signal handler to be used for sending the state to the client via
        socketIO
        """
        self.emit_ho_changed(state)

    def _dict_repr(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        try:
            data = {
                "name": self._name,
                "state": self.state(),
                "msg": self.msg(),
                "type": self._type,
                "available": self.available(),
                "readonly": self.read_only(),
                "commands": self.commands(),
                "attributes": self.attributes(),
            }

        except Exception as ex:
            # Return a default representation if there is a problem retrieving
            # any of the attributes
            self._available = False

            data = {
                "name": self._name,
                "state": "UNKNOWN",
                "msg": "Exception: %s" % str(ex),
                "type": "FLOAT",
                "available": self.available(),
                "readonly": False,
                "commands": {},
                "attributes": {},
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
    def __init__(self, ho, *args):
        """
        Args:
            (object): Hardware object to mediate for.
            (str): The name of the object.
        """
        super(ActuatorAdapterBase, self).__init__(ho, *args)

        self._unique = False

        try:
            self._read_only = ho.read_only
        except AttributeError:
            pass

    # Don't limit rate this method with utils.LimitRate, all subclasses
    # will share this method thus all methods will be effected if limit rated.
    # Rather LimitRate the function calling this one.
    def value_change(self, *args, **kwargs):
        """
        Signal handler to be used for sending values to the client via
        socketIO.
        """
        self.emit_ho_value_changed(args[0])

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
            StopIteration: When a value change was interrupted (abort/cancel).
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
        return self._get_value().value

    # Abstract method
    def stop(self):
        """
        Stop an action/movement.
        """

    def limits(self):
        """
        Read the energy limits.
        Returns:
            (tuple): Two floats (min, max).
        Raises:
            ValueError: When limits for any reason can't be retrieved.
        """
        try:
            # Limits are None when not configured, convert them to -1, -1
            # as we are returning floats
            return (0, 0) if None in self._ho.get_limits() else self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

    def _dict_repr(self):
        """Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = super(ActuatorAdapterBase, self)._dict_repr()

        try:
            data.update({"value": self.get_value(), "limits": self.limits()})
        except Exception as ex:
            logging.getLogger("MX3.HWR").exception(
                f"Could not get dictionary representation of {self._ho.name()}"
            )
            logging.getLogger("MX3.HWR").error(
                f"Check status of {self._ho.name()}, object is"
                " offline, in fault or returns unexpected value !"
            )

            self._available = False
            data.update(
                {
                    "value": 0,
                    "limits": (0, 0),
                    "type": "FLOAT",
                    "msg": "Exception %s" % str(ex),
                }
            )

        return data

    def data(self) -> HOActuatorModel:
        return HOActuatorModel(**self._dict_repr())
