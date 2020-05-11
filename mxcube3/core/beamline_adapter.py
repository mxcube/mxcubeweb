# -*- coding: utf-8 -*-
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import logging
import math

from functools import reduce

import MicrodiffInOut
import TangoShutter
import MicrodiffBeamstop
import MicrodiffInOutMockup
import ShutterMockup

from HardwareRepository.HardwareObjects.abstract import (
    AbstractNState
)

from mxcube3 import socketio
from HardwareRepository.BaseHardwareObjects import HardwareObjectState

from . import utils

from .statedefs import (
    INOUT_STATE,
    TANGO_SHUTTER_STATE,
    MICRODIFF_INOUT_STATE,
    BEAMSTOP_STATE,
)


BEAMLINE_ADAPTER = None

# Singleton like interface is needed to keep the same referance to the
# adapter object and its corresponding hardware objects, so that the signal
# system wont cleanup signal handlers. (PyDispatcher removes signal handlers
# when a object is garbage collected)


def BeamlineAdapter(*args):
    global BEAMLINE_ADAPTER

    if BEAMLINE_ADAPTER is None:
        BEAMLINE_ADAPTER = _BeamlineAdapter(*args)

    return BEAMLINE_ADAPTER


class HOAdapterBase:
    """Hardware Object Adapter Base class"""

    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object to mediate for.
            (str): The name of the object
        """
        self._ho = ho
        self._name = name
        self._avilable = True

    @property
    def ho_proxy(self):
        """
        Proxy to underlaying HardwareObject
        Returns:
            (object): HardwareObject
        """
        return self._ho

    # Abstract method
    def state(self):
        """
        Retrieves the state of the underlying hardware object.
        Returns:
            (str): The state
        """

    # Abstract method
    def msg(self):
        """
        Returns a message describing the current state. should be
        used to communicate details of the state to the user.
        Returns:
            (str): The message string.
        """
        return ""

    def read_only(self):
        """
        Check if the attibute is read only.
        Returns:
            (bool): True if read enly.
        """
        return False

    def avilable(self):
        """
        Check if the hardware object is considered to be avilable/online/enbled
        Returns:
            (bool): True if available.
        """
        return self._avilable

    # Dont't limit rate this method with utils.LimitRate, all sub-classes
    # will share this method thus all updates wont be sent if limit rated.
    # Rather LimitRate the function calling this one.
    def value_change(self, *args, **kwargs):
        """
        Signal handler to be used for sending values to the client via
        socketIO.
        """
        data = {"name": self._name, "value": args[0]}
        socketio.emit("beamline_value_change", data, namespace="/hwr")

    def state_change(self, *args, **kwargs):
        """
        Signal handler to be used for sending the state to the client via
        socketIO
        """
        socketio.emit("beamline_value_change", self.dict_repr(), namespace="/hwr")

    def _dict_repr(self):
        return {}

    def dict_repr(self):
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
                "type": "FLOAT",
                "avilable": self.avilable(),
            }

            data.update(self._dict_repr())
        except Exception as ex:
            data = {
                "name": self._name,
                "label": self._name.replace("_", " ").title(),
                "state": "UNKNOWN",
                "msg": "Exception: %s" % str(ex),
                "avilable": self.avilable(),
            }

        return data


class HOActuatorAdapterBase(HOAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object to mediate for.
            (str): The name of the object.
        """
        super(HOActuatorAdapterBase, self).__init__(ho, name)
        self._precision = 1
        self._STATES = None

    def precision(self):
        """Display precision.
        Returns:
            (int): Number of digits to be displayed.
        """
        return self._precision

    def step_size(self):
        return math.pow(10, -self._precision)

    # def __getattr__(self, attr):
    #     if attr.startswith("__"):
    #         raise AttributeError(attr)

    #     return getattr(self._ho, attr)

    # Abstract method
    def set(self, value):
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

    # Abstract method
    def get(self):
        """
        Retrieve value from underlying hardware object.
        Returns:
            (str): The value.
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """

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
        return 0, 1, 1

    def dict_repr(self):
        """Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = super(HOActuatorAdapterBase, self).dict_repr()

        try:
            data.update(
                {
                    "value": self.get(),
                    "limits": self.limits(),
                    "precision": self.precision(),
                    "step": self.step_size(),
                }
            )
        except Exception as ex:
            data.update(
                {
                    "value": 0,
                    "limits": (0, 0, 0),
                    "type": "FLOAT",
                    "precision": 0,
                    "step": 0,
                    "msg": "Exception %s" % str(ex),
                }
            )
        return data


class EnergyHOAdapter(HOActuatorAdapterBase):
    """
    Adapter for Energy Hardware Object, a web socket is used to communicate
    information on longer running processes.
    """

    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(EnergyHOAdapter, self).__init__(ho, name)

        if ho.read_only:
            try:
                ho.connect("energyChanged", self._value_change)
                ho.connect("stateChanged", self.state_change)
            except BaseException:
                pass
        self._precision = 4

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
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
            self._ho.set_value(float(value))
            return self.get()
        except BaseException:
            raise

    def get(self):
        """
        Read the energy.
        Returns:
            (float as str): Energy [keV].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            value = self._ho.get_value()
            value = round(float(value), self._precision)
            value = ("{:3.%sf}" % self._precision).format(value)
            return value
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

    def state(self):
        """
        Get the state.
        Returns:
            (str): The state.
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
        Read the energy limits.
        Returns:
            (tuple): Two floats (min, max).
        Raises:
            ValueError: When limits for any reason can't be retrieved.
        """
        try:
            return self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

    def read_only(self):
        """
        Check if the energy is tunable or not.
        Retuns:
            (bool): True if tunable, False if not.
        """
        return not self._ho.read_only


class WavelengthHOAdapter(HOActuatorAdapterBase):
    """
    Adapter for wavelength Hardware Object, a web socket is used communicate
    information on longer running processes.
    """

    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(WavelengthHOAdapter, self).__init__(ho, name)

        if ho.read_only:
            try:
                ho.connect("energyChanged", self._value_change)
                ho.connect("stateChanged", self.state_change)
            except BaseException:
                pass
        self._precision = 4

    @utils.RateLimited(6)
    def _value_change(self, pos, wl, *args, **kwargs):
        self.value_change(wl)

    def set(self, value):
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
            self._ho.set_wavelength(float(value))
            return self.get()
        except BaseException:
            raise

    def get(self):
        """
        Read the wavelength value.
        Returns:
            (float as str): Wavelength [Å].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            value = self._ho.get_wavelength()
            value = round(float(value), self._precision)
            value = ("{:2.%sf}" % self._precision).format(value)
            return value
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

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
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

    def read_only(self):
        """
        Check if the wavelength is read only or not.
        Retuns:
            (bool): True if read only, False if not.
        """
        return not self._ho.read_only


class DuoStateHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(DuoStateHOAdapter, self).__init__(ho, name)
        self._connect_signals(ho)

    def _connect_signals(self, ho):
        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            self._STATES = MICRODIFF_INOUT_STATE
            ho.connect("actuatorStateChanged", self.state_change)
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            ho.connect("value_changed", self.state_change)
            self._STATES = TANGO_SHUTTER_STATE
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            self._STATES = TANGO_SHUTTER_STATE
            ho.connect("shutterStateChanged", self.state_change)
        elif isinstance(self._ho, MicrodiffBeamstop.MicrodiffBeamstop):
            self._STATES = BEAMSTOP_STATE
            ho.connect("positionReached", self.state_change)
            ho.connect("noPosition", self.state_change)
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            self._STATES = BEAMSTOP_STATE
            ho.connect("actuatorStateChanged", self.state_change)

    def _get_state(self):
        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            state = self._ho.get_actuator_state()
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            state = self._ho.get_value().value
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            state = self._ho.state_value_str
        elif isinstance(self._ho, MicrodiffBeamstop.MicrodiffBeamstop):
            state = self._ho.getPosition()
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            state = self._ho.get_actuator_state()

        state = self._STATES.TO_INOUT_STATE.get(state, INOUT_STATE.UNDEFINED)

        return state

    def _close(self):
        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            self._ho.actuatorOut()
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            self._ho.close()
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            self._ho.closeShutter()
        elif isinstance(self._ho, MicrodiffBeamstop.MicrodiffBeamstop):
            self._ho.moveToPosition("out")
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            self._ho.actuatorIn()

    def _open(self):
        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            self._ho.actuatorIn()
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            self._ho.open()
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            self._ho.openShutter()
        elif isinstance(self._ho, MicrodiffBeamstop.MicrodiffBeamstop):
            self._ho.moveToPosition("in")
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            self._ho.actuatorOut()

    def commands(self):
        cmds = ["Out", "In"]

        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            cmds = ["Open", "Close"]
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            cmds = ["Open", "Close"]

        return cmds

    def set(self, state):
        if state == INOUT_STATE.IN:
            self._close()
        elif state == INOUT_STATE.OUT:
            self._open()

    def get(self):
        return INOUT_STATE.STR_TO_VALUE.get(self._get_state(), 2)

    def stop(self):
        self._ho.stop()

    def state(self):
        return self._get_state()

    def msg(self):
        state = self._get_state()
        try:
            msg = self._STATES.STATE_TO_MSG_STR.get(state, "---")
        except BaseException:
            msg = ""
            logging.getLogger("MX3.HWR").error(
                "Failed to get beamline attribute message"
            )

        return msg

    def _dict_repr(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = {
            "name": self._name,
            "label": self._name.replace("_", " ").title(),
            "value": self.get(),
            "limits": self.limits(),
            "state": self.state(),
            "msg": self.msg(),
            "commands": self.commands(),
            "type": "DUOSTATE",
            "readonly": self.read_only(),
        }

        return data


class TransmissionHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(TransmissionHOAdapter, self).__init__(ho, name)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)
        self._precision = 2

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
        """Set the transmission.
        Args:
            value(float): Transmission [%].
        Returns:
            (float as str): The transmission value [%].
        Raises:
            ValueError: Cannot set transmission.
        """
        try:
            self._ho.set_value(round(float(value), self._precision))
            return self.get()
        except Exception as ex:
            raise ValueError("Cannot set transmission: %s" % str(ex))

    def get(self):
        """
        Get the transmission value.
        Returns:
            (float as str): Transmission [%].
        """
        try:
            value = self._ho.get_value()
            value = round(float(value), self._precision)
        except (AttributeError, TypeError):
            value = 0.0

        value = ("{:3.%sf}" % self._precision).format(value)
        return value

    def state(self):
        """
        Get the state.
        Returns:
            (str): The state.
        """
        return self._ho.get_state().name

    def limits(self):
        """
        Get the transmission limits.
        Returns:
            (tuple): Two floats (min, max).
        """
        try:
            return self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")


class ResolutionHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(ResolutionHOAdapter, self).__init__(ho, name)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)
        self._precision = 3

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
        """
        Set the resolution.
        Args:
            value (float): Target resolution [Å].
        Returns:
            (str): The actual value set.
        Raises:
            ValueError: Value not valid.
            RuntimeError: Timeout while setting the value.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        self._ho.set_value(round(float(value), self._precision))
        return self.get()

    def get(self):
        """
        Read the resolution.
        Returns:
            (float as str): Resolution [Å].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            value = self._ho.get_value()
            value = round(float(value), self._precision)
        except (TypeError, AttributeError):
            value = 0.0

        value = ("{:2.%sf}" % self._precision).format(value)
        return value

    def state(self):
        """
        Get the state.
        Returns:
            (str): The state.
        """
        return self._ho.get_state().name

    def stop(self):
        """
        Stop the execution.
        """
        self._ho.abort()

    def limits(self):
        """
        Read the resolution limits.
        Returns:
            (tuple): Two floats (min, max).
        Raises:
            ValueError: When limits for any reason can't be retrieved.
        """
        try:
            return self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

    def get_lookup_limits(self):
        return self.limits()

    def _dict_repr(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = {
            "name": self._name,
            "label": self._name.replace("_", " ").title(),
            "value": self.get(),
            "limits": self.get_lookup_limits(),
            "state": self.state(),
            "msg": self.msg(),
            "precision": self.precision(),
            "step": self.step_size(),
            "readonly": self.read_only(),
        }
        return data


class DetectorDistanceHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(DetectorDistanceHOAdapter, self).__init__(ho, name)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)
        self._precision = 3

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
        """
        Set the detector distance.
        Args:
            value (float): Target distance [mm].
        Returns:
            (str): The actual value set.
        Raises:
            ValueError: Value not valid.
            RuntimeError: Timeout while setting the value.
            StopItteration: When a value change was interrupted (abort/cancel).
        """
        self._ho.set_value(round(float(value), self._precision))
        return self.get()

    def get(self):
        """
        Read the detector distance.
        Returns:
            (float as str): Detector distance [mm].
        Raises:
            ValueError: When value for any reason can't be retrieved.
        """
        try:
            value = self._ho.get_value()
            value = round(float(value), self._precision)
        except (TypeError, AttributeError):
            value = 0.0

        value = ("{:4.%sf}" % self._precision).format(value)
        return value

    def state(self):
        """
        Get the state.
        Returns:
            (str): The state.
        """
        return self._ho.get_state().name

    def stop(self):
        self._ho.abort()

    def limits(self):
        """
        Read the detector distance limits.
        Returns:
            (tuple): Two floats (min, max).
        Raises:
            ValueError: When limits for any reason can't be retrieved.
        """
        try:
            return self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")


class MachineInfoHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(MachineInfoHOAdapter, self).__init__(ho, name)
        ho.connect("valueChanged", self._value_change)
        self._precision = 1

    def set(self, value):
        pass

    @utils.RateLimited(0.1)
    def _value_change(self, *args, **kwargs):
        self.value_change(self.get(), **kwargs)

    def get(self):
        return {
            "current": self.get_current(),
            "message": self.get_message(),
            "fillmode": self.get_fill_mode(),
        }

    def get_message(self):
        try:
            message = self._ho.getMessage()
        except (TypeError, AttributeError):
            message = ""

        return message

    def get_current(self):
        try:
            current = self._ho.getCurrent()
            current = (
                current
                if isinstance(current, str)
                else "{:.1f} mA".format(round(float(self._ho.getCurrent()), 1))
            )
        except (TypeError, AttributeError):
            current = "-1"

        return current

    def get_fill_mode(self):
        try:
            fmode = self._ho.getFillMode()
        except (TypeError, AttributeError):
            fmode = ""

        return fmode

    def limits(self):
        """
        Returns: The detector distance limits.
        """
        return []

    def stop(self):
        pass

    def state(self):
        return HardwareObjectState.READY.value


class PhotonFluxHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(PhotonFluxHOAdapter, self).__init__(ho, name)

        try:
            ho.connect("valueChanged", self._value_change)
        except BaseException:
            pass
        self._precision = 1

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value=None):
        """Read only"""

    def get(self):
        """
        Get the photon flux.
        Returns:
            (float as str): Flux.
        """
        try:
            value = self._ho.current_flux
        except BaseException:
            value = "0"

        return value

    """
    def message(self):
        return ""
    """

    def limits(self):
        """No limits"""
        return ()

    def state(self):
        """Always READY"""
        return HardwareObjectState.READY.name

    def _dict_repr(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = {
            "name": self._name,
            "label": self._name.replace("_", " ").title(),
            "value": self.get(),
            "limits": self.limits(),
            "state": self.state(),
            "msg": self.msg(),
            "precision": self.precision(),
            "readonly": self.read_only(),
        }

        return data


class CryoHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(CryoHOAdapter, self).__init__(ho, name)

        try:
            ho.connect("valueChanged", self._value_change)
        except BaseException:
            pass

        try:
            ho.connect("stateChanged", self._state_change)
        except BaseException:
            pass
        self._precision = 1

    @utils.RateLimited(1)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    @utils.RateLimited(1)
    def _state_change(self, *args, **kwargs):
        self.state_change(*args, **kwargs)

    def set(self, value=None):
        """Read only"""

    def get(self):
        """
        Get the cryostream temperature.
        Returns:
            (float as str): Temperature [deg K].
        """
        try:
            value = self._ho.get_value()
            value = round(float(value), self._precision)
        except (AttributeError, TypeError):
            value = 0.0

        value = ("{:3.%sf}" % self._precision).format(value)
        return value

    """
    def message(self):
        return ""
    """

    def limits(self):
        """No limits."""
        return ()

    def state(self):
        """Always READY"""
        return HardwareObjectState.READY.name

    def _dict_repr(self):
        """
        Dictionary representation of the hardware object.
        Returns:
            (dict): The dictionary.
        """
        data = {
            "name": self._name,
            "label": self._name.replace("_", " ").title(),
            "value": self.get(),
            "limits": self.limits(),
            "state": self.state(),
            "msg": self.msg(),
            "precision": self.precision(),
            "readonly": self.read_only(),
        }

        return data


class DataPublisherHOAdapter(HOAdapterBase):
    def __init__(self, ho, name=""):
        """
        Args:
            (object): Hardware object.
            (str): The name of the object.
        """
        super(DataPublisherHOAdapter, self).__init__(ho, name)

        try:
            ho.connect("data", self._new_data_handler)
            ho.connect("start", self._update_publisher_handler)
            ho.connect("end", self._update_publisher_handler)
        except BaseException:
            msg = "Could not initialize DataPublisherHOAdapter"
            logging.getLogger("HWR").exception(msg)
        else:
            self._available = True

    def _new_data_handler(self, data):
        socketio.emit("data_publisher_new_data", data, namespace="/hwr")

    def _update_publisher_handler(self, data):
        socketio.emit("data_publisher_update", data, namespace="/hwr")

    def state(self):
        return HardwareObjectState.READY.value


class _BeamlineAdapter:
    """
    Adapter between Beamline route and Beamline hardware object.
    """

    _ADAPTER_MAP = {
        "energy": ("energy", EnergyHOAdapter),
        "wavelength": ("energy", WavelengthHOAdapter),
        "resolution": ("resolution", ResolutionHOAdapter),
        "transmission": ("transmission", TransmissionHOAdapter),
        "fast_shutter": ("fast_shutter", DuoStateHOAdapter),
        "safety_shutter": ("safety_shutter", DuoStateHOAdapter),
        "machine_info": ("machine_info", MachineInfoHOAdapter),
        "flux": ("flux", PhotonFluxHOAdapter),
        "data_publisher": ("data_publisher", DataPublisherHOAdapter),
        "cryo": ("diffractometer.cryo", CryoHOAdapter),
        "capillary": ("diffractometer.capillary", DuoStateHOAdapter),
        "beamstop": ("diffractometer.beamstop", DuoStateHOAdapter),
        "detector_distance": ("detector.distance", DetectorDistanceHOAdapter),
    }

    _TO_SERIALIZE = [
        "energy",
        "wavelength",
        "resolution",
        "transmission",
        "fast_shutter",
        "safety_shutter",
        "machine_info",
        "flux",
        "cryo",
        "capillary",
        "beamstop",
        "detector_distance",
    ]

    def __init__(self, beamline_hwobj):
        self._bl = beamline_hwobj
        self._ho_dict = {}

        workflow = self._bl.workflow

        for role, mapping in self._ADAPTER_MAP.items():
            attr_path, adapter = mapping
            attr = None

            try:
                attr = self._getattr_from_path(self._bl, attr_path)
            except:
                logging.getLogger("MX3.HWR").info("Could not add adapter for %s" % role)
            else:
                if attr:
                    setattr(self, role, adapter(attr, role))
                    logging.getLogger("MX3.HWR").info("Added adapter for %s" % role)
                else:
                    logging.getLogger("MX3.HWR").info(
                        "Could not add adapter for %s" % role
                    )

        if workflow:
            workflow.connect("parametersNeeded", self.wf_parameters_needed)

    def _getattr_from_path(self, obj, attr):
        """Recurses through an attribute chain to get the attribute."""
        return reduce(getattr, attr.split("."), obj)

    def wf_parameters_needed(self, params):
        socketio.emit("workflowParametersDialog", params, namespace="/hwr")

    def get_object(self, name):
        return getattr(self, name)

    def dict_repr(self):
        """
        Build dictionary value-representation for each beamline attribute
        listed in _TO_SERIALIZE.
        Returns:
           (dict): The dictionary.
        """
        attributes = {}

        for attr_name in self._TO_SERIALIZE:
            try:
                _d = getattr(self, attr_name).dict_repr()
                attributes.update({attr_name: _d})
            except Exception:
                logging.getLogger("MX3.HWR").error(
                    "Failed to get dictionary representation of %s" % attr_name
                )

        return {"attributes": attributes}

    def get_available_methods(self):
        """
        Get the available methods.
        Returns:
            (list): The methods.
        """
        return self._bl.available_methods

    def get_available_elements(self):
        escan = self._bl.energy_scan
        elements = []

        if escan:
            elements = escan.getElements()

        return {"elements": elements}

    def get_acquisition_limit_values(self):
        """
        Get the limits for the acquisition parameters.
        Returns:
            (dict): The limits.
        """
        _limits = self._bl.get_acquisition_limit_values()
        limits = {}

        for key, value in _limits.items():
            if isinstance(value, str) and "," in value:
                try:
                    limits[key] = list(map(float, _limits[key].split(",")))
                except BaseException:
                    msg = "[BEAMLINE_ADAPTER] Could not get limits for %s," % key
                    msg += " using -10000, 10000"
                    logging.getLogger("MX3.HWR").info(msg)
                    limits[key] = [-10000, 10000]
            else:
                limits[key] = value

        return limits
