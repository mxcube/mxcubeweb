import logging
from enum import Enum
from typing import ClassVar

from mxcubecore.BaseHardwareObjects import HardwareObject
from mxcubecore.HardwareObjects.BeamlineActions import BeamlineActions
from pydantic.v1 import (
    BaseModel,
)

from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.components.queue import (
    FAILED,
    READY,
    RUNNING,
)
from mxcubeweb.core.models.adaptermodels import (
    BeamlineActionInputModel,
    HOActuatorValueChangeModel,
    NStateModel,
)
from mxcubeweb.core.models.configmodels import ResourceHandlerConfigModel

resource_handler_config = ResourceHandlerConfigModel(
    commands=["stop", "run_action"], attributes=["data", "get_all_actions"]
)


class Argument(BaseModel):
    name: str
    type: str
    items: list[str] | None = None


class JSONSchemaArgument(BaseModel):
    name: str
    type: str
    jsonschema: str = ""
    signature: list[str]


class Action(BaseModel):
    name: str
    username: str
    state: int
    arguments: list[JSONSchemaArgument | Argument]
    argument_type: str
    messages: list[str]
    type: str
    data: str | dict | None


class ActionsList(BaseModel):
    actions_list: list[Action]


class BeamlineActionAdapter(AdapterBase):
    SUPPORTED_TYPES: ClassVar[list[object]] = [BeamlineActions]

    def __init__(
        self,
        ho: HardwareObject,
        role: str,
        app,
        resource_handler_config: ResourceHandlerConfigModel = resource_handler_config,
    ):
        """
        Args:
            (object): Hardware object.
        """
        super().__init__(ho, role, app, resource_handler_config)
        self._value_change_model = HOActuatorValueChangeModel

        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

        for cmd in ho.get_commands() + ho.get_annotated_commands():
            cmd.connect(
                "commandBeginWaitReply",
                self._beamline_action_start,
            )
            cmd.connect(
                "commandReplyArrived",
                self._beamline_action_done,
            )
            cmd.connect(
                "commandFailed",
                self._beamline_action_failed,
            )

    def _value_change(self, value):
        v = value.name if isinstance(value, Enum) else value
        self.value_change(v)

    def _emit_beamline_action(self, msg):
        self.app.server.emit("beamline_action", msg, namespace="/hwr")

    def _beamline_action_start(self, name):
        msg = {"name": name, "state": RUNNING}
        self._emit_beamline_action(msg)
        logging.getLogger("user_level_log").info("Command %s started.", name)

    def _beamline_action_done(self, name, result):
        msg = {"name": name, "state": READY, "data": result}
        self._emit_beamline_action(msg)
        logging.getLogger("user_level_log").info("Command %s done.", name)

    def _beamline_action_failed(self, name):
        msg = {"name": name, "state": FAILED}
        self._emit_beamline_action(msg)
        logging.getLogger("user_level_log").error("Action %s failed!", name)

    def msg(self):
        return ""

    def stop(self):
        """
        Stop the execution.
        """
        for cmd in self._ho.get_commands():
            self._ho.abort_command(cmd.name())

    def _valid_action_input(self, value: dict | list) -> bool:
        """
        Validates that the the action input value structure is
        flat and contains only valid types (str, int, float, bool).

        Args:
            value The structure to validate.
        Returns:
            bool: True if valid, False otherwise.
        """
        allowed_types = (str, int, float, bool)

        if isinstance(value, list):
            return all(isinstance(item, allowed_types) for item in value)
        if isinstance(value, dict):
            return all(isinstance(item, allowed_types) for item in value.values())
        return False

    def run_action(self, value: BeamlineActionInputModel):
        """
        Starts beamline action
        """
        # Beamline actions are retrieved from a finite list of commands
        # its either a simple command name or an annotated command
        # Getting the KeyError means that the command is not annotated
        try:
            self._ho.get_annotated_command(value.cmd)
        except KeyError:
            annotated_cmd = False
        else:
            annotated_cmd = True

        # Annotated commands are validated against their Pydantic model
        # Simple comamands are validated with _valid_action_input
        if not annotated_cmd and self._valid_action_input(value.parameters) is False:
            msg = (
                f"Action '{value.cmd}' cannot run: parameters must contain"
                " (str, int, float, bool)"
                f" but got '{type(value.parameters)}'"
            )
            logging.getLogger("MX3.HWR").error(msg)
            raise ValueError(msg)

        try:
            self._ho.execute_command(value.cmd, value.parameters)
        except Exception:
            msg = f"Action cannot run: command {value.cmd} does not exist"
            logging.getLogger("MX3.HWR").exception(msg)
            raise

    def get_all_actions(self) -> ActionsList:
        actions: list[Action] = []

        try:
            cmds = self._ho.get_commands()
        except Exception:
            cmds = []

        for cmd in cmds:
            args: list[Argument] = []
            for arg in cmd.get_arguments():
                argname = arg[0]
                argtype = arg[1]

                argument_data = {"name": argname, "type": argtype}
                if argtype == "combo":
                    argument_data["items"] = cmd.get_combo_argument_items(argname)
                args.append(Argument(**argument_data))

            action = Action(
                name=cmd.name(),
                username=cmd.name(),
                state=READY,
                arguments=args,
                argument_type=cmd.argument_type,
                messages=[],
                type=cmd.type,
                data=cmd.value(),
            )
            actions.append(action)

        if getattr(self._ho, "pydantic_model", None):
            for cmd_name in self._ho.exported_attributes:
                cmd_object = self._ho.get_annotated_command(cmd_name)
                exported = self._ho.exported_attributes[cmd_name]

                json_arg = JSONSchemaArgument(
                    name=cmd_name,
                    type="JSONSchema",
                    jsonschema=exported["schema"],
                    signature=exported["signature"],
                )

                action = Action(
                    name=cmd_name,
                    username=cmd_object.name(),
                    state=READY,
                    arguments=[json_arg],
                    argument_type="JSONSchema",
                    jsonschema=exported["schema"],
                    messages=[],
                    type="JSONSchema",
                    data="",
                )
                actions.append(action)

        return ActionsList(actions_list=actions)

    def data(self) -> NStateModel:
        return NStateModel(**self._dict_repr())
