from enum import Enum
from mxcubecore.HardwareObjects.abstract import AbstractNState

# from mxcubecore.HardwareObjects import (
#     MicrodiffInOut,
#     TangoShutter,
#     MicrodiffBeamstop
# )


# from mxcubecore.HardwareObjects.mockup import (
#    MicrodiffInOutMockup,
#    ShutterMockup
# )

# The way HardwareObject paths are insterted into sys.path
# in mxcubecore makes it necassary to do these imports like this
import MicrodiffInOutMockup
import ShutterMockup
import MicrodiffInOut
import TangoShutter
import MicrodiffBeamstop


from mxcube3.core import utils

from mxcube3.core.adapter.statedefs import (
    INOUT_STATE,
    TANGO_SHUTTER_STATE,
    BEAMSTOP_STATE,
    ABSTRACT_NSTATE_TO_VALUE,
)

from mxcube3.core.adapter.adapter_base import ActuatorAdapterBase


class DuoStateAdapter(ActuatorAdapterBase):
    def __init__(self, ho, name, **kwargs):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(DuoStateAdapter, self).__init__(ho, name, **kwargs)
        self._connect_signals(ho)

    def _connect_signals(self, ho):
        if isinstance(self._ho, AbstractNState.AbstractNState):
            ho.connect("valueChanged", self.state_change)
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            self._STATES = TANGO_SHUTTER_STATE
            ho.connect("shutterStateChanged", self.state_change)
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            self._STATES = BEAMSTOP_STATE
            ho.connect("actuatorStateChanged", self.state_change)

    def _get_state(self):
        if isinstance(self._ho, AbstractNState.AbstractNState):
            state = self._ho.get_value()
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            state = self._ho.state_value_str
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            state = self._ho.get_actuator_state()

        if not isinstance(state, Enum):
            state = self._STATES.TO_INOUT_STATE.get(state, INOUT_STATE.UNDEFINED)

        return state

    def _get_abstract_state_action(self):
        state_names = [v.name for v in self._ho.VALUES]
        state_names.remove("UNKNOWN")
        state_names.remove(self._ho.get_value().name)

        return state_names[0]

    def _close(self):
        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            self._ho.actuatorOut()
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            self._ho.set_value(self._ho.VALUES[self._get_abstract_state_action()])
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            self._ho.closeShutter()
        elif isinstance(self._ho, MicrodiffBeamstop.MicrodiffBeamstop):
            self._ho.moveToPosition("out")
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            self._ho.actuatorIn()

    def _open(self):
        if isinstance(self._ho, AbstractNState.AbstractNState):
            self._ho.set_value(self._ho.VALUES[self._get_abstract_state_action()])
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            self._ho.openShutter()
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            self._ho.actuatorOut()

    def commands(self):
        cmds = ("Out", "In")

        if isinstance(self._ho, AbstractNState.AbstractNState):
            state_names = [v.name for v in self._ho.VALUES]

            if "OPEN" in state_names:
                cmds = ("Close", "Open")
            else:
                cmds = ("Out", "In")
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            cmds = ("Open", "Close")

        return cmds

    def _set_value(self, state):
        if state == INOUT_STATE.IN:
            self._close()
        elif state == INOUT_STATE.OUT:
            self._open()

    def _get_value(self):
        state = self._get_state()

        if isinstance(state, Enum):
            value = ABSTRACT_NSTATE_TO_VALUE.get(state.name, 2)
        else:
            value = INOUT_STATE.STR_TO_VALUE.get(self._get_state(), 2)

        return value

    def stop(self):
        self._ho.stop()

    def state(self):
        state = self._get_state()

        if isinstance(state, Enum):
            state = state.name

        return state

    def msg(self):
        state = self._get_state()

        try:
            if isinstance(state, Enum):
                msg = state.name
            else:
                msg = self._STATES.STATE_TO_MSG_STR.get(state, "---")
        except BaseException:
            msg = "---"
            logging.getLogger("MX3.HWR").error(
                "Failed to get beamline attribute message"
            )

        return msg

    def _to_dict(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = {
            "value": self.get_value(),
            "limits": self.limits(),
            "commands": self.commands(),
            "type": "DUOSTATE",
        }

        return data
