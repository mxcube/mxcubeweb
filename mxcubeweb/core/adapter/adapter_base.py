import contextlib
import inspect
import logging
import traceback
import typing
from typing import Any, ClassVar

import gevent
from pydantic.v1 import (
    Field,
    ValidationError,
    create_model,
)

from mxcubeweb.core.models.adaptermodels import (
    HOActuatorModel,
    HOModel,
)
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel
from mxcubeweb.core.server.resource_handler import (
    ResourceHandlerFactory,
)

default_resource_handler_config = ResourceHandlerConfigModel(
    commands=[
        "set_value",
        "get_value",
    ],
    attributes=["data"],
)


class AdapterBase:
    """Hardware Object Adapter Base class"""

    # List of supported HO base classes (or callable for more advanced matching)
    SUPPORTED_TYPES: ClassVar[list[object]] = []
    # Dictionary of supported types and their adapters
    SUPPORTED_TYPES_TO_ADAPTERS = {}

    ATTRIBUTES = []
    METHODS = []

    ADAPTER_DICT = {}

    def __init__(self, ho, role, app, resource_handler_config=None):
        """
        Args:
            ho (object): Hardware object to mediate for.
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

        cls_name = self.__class__.__name__.lower()

        if cls_name not in self.ADAPTER_DICT:
            self.ADAPTER_DICT[cls_name] = {}

        if ho is not None:
            self.ADAPTER_DICT[cls_name][ho.name] = self

        if resource_handler_config:
            ResourceHandlerFactory.create_or_get(
                name=cls_name,
                url_prefix="/mxcube/api/v0.1/hwobj/" + self._type.lower(),
                handler_dict=self.ADAPTER_DICT[cls_name],
                app=self.app,
                exports=resource_handler_config.exports,
                commands=resource_handler_config.commands,
                attributes=resource_handler_config.attributes,
            )

    @classmethod
    def can_adapt(cls, ho):
        return any(isinstance(ho, t) for t in cls.SUPPORTED_TYPES)

    def __init_subclass__(cls, **kwargs):
        for ho_class in cls.SUPPORTED_TYPES:
            if ho_class in AdapterBase.SUPPORTED_TYPES_TO_ADAPTERS:
                error_msg = ("Adapter for class %s already exists", ho_class.__name__)
                raise ValueError(error_msg)
            AdapterBase.SUPPORTED_TYPES_TO_ADAPTERS[ho_class] = cls
        super().__init_subclass__(**kwargs)

    @classmethod
    def get_resource_handler(cls):
        return AdapterBase.RESOURCE_HANDLER_DICT.get(cls.__name__, None)

    def get_adapter_id(self, ho=None):
        ho = ho if ho else self._ho
        return self.app.mxcubecore._get_adapter_id(ho)

    def _add_adapter(self, attr_name, ho, adapter_cls):
        _id = f"{self.get_adapter_id()}.{attr_name}"
        adapter_instance = adapter_cls(ho, _id, self.app)
        self.app.mxcubecore._add_adapter(_id, adapter_cls, ho, adapter_instance)

        setattr(self, attr_name, adapter_instance)

    def execute_command(self, cmd_name, args):
        try:
            self._pydantic_model_for_command(cmd_name).validate(args)
        except ValidationError:
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
        except ValidationError:
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
                input_dict[_n] = (_t, Field(alias=_n))
            else:
                if not inspect.isclass(_t):
                    _t = _t.__class__

                output_dict[_n] = (_t, Field(alias=_n))

        return {
            "args": create_model(attr.__name__, **input_dict),
            "return": create_model(attr.__name__, **output_dict),
            "signature": list(input_dict.keys()),
        }

    def _pydantic_model_for_command(self, cmd_name):
        if cmd_name in self.METHODS:
            return self._model_from_typehint(getattr(self, cmd_name, None))["args"]
        return self._ho.pydantic_model[cmd_name]

    def _exported_methods(self):
        exported_methods = {}

        # Get exported attributes from underlaying HardwareObject
        # and only set display True for those methods that have
        # been explicitly configured to be exported
        configured_exported = self._ho.exported_attributes.keys()

        rh = ResourceHandlerFactory.get_handler(self.__class__.__name__.lower())

        if rh:
            for export in rh.commands:
                attr = getattr(self, export["attr"], None)

                if inspect.ismethod(attr):
                    model = self._model_from_typehint(attr)
                    exported_methods[export["attr"]] = {
                        "signature": model["signature"],
                        "schema": model["args"].schema_json(),
                        "display": export["attr"] in configured_exported,
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
                except ValidationError:
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
        data = self.data().dict()

        if hasattr(state, "name"):
            data["state"] = state.name
        else:
            logging.getLogger("MX3.HWR").info(
                f"emit_ho_changed with {state} for {self._ho.name}"
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

    def data(self) -> HOModel:
        return HOModel(**self._dict_repr())


class ActuatorAdapterBase(AdapterBase):
    def __init__(self, ho, role, app, resource_handler_config=None):
        """
        Args:
            (object): Hardware object to mediate for.
            (str): The name of the object.
        """
        super().__init__(ho, role, app, resource_handler_config)

        self._unique = False

        with contextlib.suppress(AttributeError):
            self._read_only = ho.read_only

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
    def set_value(self, value) -> str:
        """
        Sets a value on underlying hardware object.

        Args:
            value(float): Value to be set.
        Returns:
            (str): The actual value set as str.
        Raises:
            ValueError: When conversion or treatment of value fails.
            StopIteration: When a value change was interrupted (abort/cancel).
        Emits:
            hardware_object_value_changed with values over websocket
        """

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
            msg = "Could not get limits"
            raise ValueError(msg)

    def _dict_repr(self):
        """Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = super()._dict_repr()

        try:
            data.update({"value": self.get_value().value, "limits": self.limits()})
        except Exception as ex:
            logging.getLogger("MX3.HWR").exception(
                f"Could not get dictionary representation of {self._ho.name}"
            )
            logging.getLogger("MX3.HWR").error(
                f"Check status of {self._ho.name}, object is"
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
