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


class HOAdapterBase(object):
    def __init__(self, ho, name=""):
        """
        :param HardwareObject ho: Hardware object to mediate for.
        :returns: None
        """
        self._ho = ho
        self._name = name
        self._avilable = True

    @property
    def ho_proxy(self):
        """
        Proxy to underlaying HardwareObject

        :returns: HardwareObject
        """
        return self._ho

    # Abstract method
    def state(self):
        """
        Retrieves the state of the underlying hardware object.

        :returns: The state
        :rtype: str
        """

    # Abstract method
    def msg(self):
        """
        :returns: Returns a message describing the current state, should be
                  used to communicate details of the state to the user.

        :rtype: str
        """
        return ""

    def read_only(self):
        """
        :returns: Returns true if the attribute is read only, (cant be set)
        :rtype: Boolean
        """
        return False

    def avilable(self):
        """
        :returns: True if the hardware objcts is considered to be avilable/online/enbled
                  False otherwise.
        :rtype: Boolean
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

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        try:
            data = {
                "name": self._name,
                "label": self._name.replace("_", " ").title(),
                "state": self.state().name,
                "msg": self.msg(),
                "avilable": self.avilable()
            }
        except Exception as ex:
            data = {
                "name": self._name,
                "label": self._name.replace("_", " ").title(),
                "state": "UNKNOWN",
                "msg": "Exception: %s" % str(ex),
                "avilable": self.avilable()
            }

        return data


class HOActuatorAdapterBase(HOAdapterBase):
    def __init__(self, ho, name=""):
        """
        :param HardwareObject ho: Hardware object to mediate for.
        :returns: None
        """
        super(HOActuatorAdapterBase, self).__init__(ho, name)
        self._precision = 1
        self._STATES = None

    def precision(self):
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

        :param value: Value to set (castable to float)

        :raises ValueError: When conversion or treatment of value fails
        :raises StopItteration: When a value change was interrupted
        (aborted or canceled)

        :returns: The actual value set on the device
                  (not necessarily the one passed)
        :rtype: float
        """

    # Abstract method
    def get(self):
        """
        Retrieves value from underlying hardware object.

        :returns: The value
        :rtype: float
        :raises ValueError: When value for any reason can't be retrieved
        """

    # Abstract method
    def stop(self):
        """
        Stops a action/movement

        :returns: None
        :rtype: None
        """

    # Abstract method
    def limits(self):
        """
        :returns: The limits and default stepsize of the device, on the format
                  (upper, lower, step)
        """
        return (0, 1, 1)

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = super(HOActuatorAdapterBase, self).dict_repr()

        try:
            data.update({
                "value": self.get(),
                "limits": self.limits(),
                "type": "FLOAT",
                "precision": self.precision(),
                "step": self.step_size(),
            })
        except Exception as ex:
            data.update({
                "value": 0,
                "limits": (0, 0, 0),
                "type": "FLOAT",
                "precision": 0,
                "step": 0,
                "msg": "Exception %s" % str(ex),
            })

        return data


class EnergyHOAdapter(HOActuatorAdapterBase):
    """
    Adapter for Energy Hardware Object, a web socket is used communicate
    information on longer running processes.
    """

    def __init__(self, ho, name=""):
        super(EnergyHOAdapter, self).__init__(ho, name)

        if ho.tunable:
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
        :param value: Value (castable to float) to set

        :raises ValueError: When value for any reason can't be retrieved
        :raises StopItteration: When a value change was interrupted
                                (aborted or canceled)

        :returns: The actual value set
        :rtype: float
        """
        try:
            self._ho.move_energy(float(value))
            res = self.get()
        except BaseException:
            raise

        return res

    def get(self):
        """
        :returns: The value
        :rtype: float
        :raises ValueError: When value for any reason can't be retrieved
        """
        try:
            energy = self._ho.get_value()
            energy = round(float(energy), self._precision)
            energy = ("{:3.%sf}" % self._precision).format(energy)
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

        return energy

    def state(self):
        """
        state = MOTOR_STATE.READY

        try:
            state = MOTOR_STATE.READY if self._ho.is_ready() else MOTOR_STATE.MOVING
        except BaseException:
            pass
        """
        state = self._ho.get_state()
        return state

    def stop(self):
        self._ho.stop()

    def limits(self):
        """
        :returns: The energy limits.
        """
        try:
            energy_limits = self._ho.get_limits()
        except (AttributeError, TypeError):
            energy_limits = (0, 0)
            raise ValueError("Could not get limits")

        return energy_limits

    def read_only(self):
        return not self._ho.tunable


class WavelengthHOAdapter(HOActuatorAdapterBase):
    """
    Adapter for wavelength Hardware Object, a web socket is used communicate
    information on longer running processes.
    """

    def __init__(self, ho, name=""):
        super(WavelengthHOAdapter, self).__init__(ho, name)

        if ho.tunable:
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
        :param value: Value (castable to float) to set

        :raises ValueError: When value for any reason can't be retrieved
        :raises StopItteration: When a value change was interrupted
                                (aborted or canceled)

        :returns: The actual value set
        :rtype: float
        """
        try:
            self._ho.move_wavelength(float(value))
            res = self.get()
        except BaseException:
            raise

        return res

    def get(self):
        """
        :returns: The value
        :rtype: float
        :raises ValueError: When value for any reason can't be retrieved
        """
        try:
            wavelength = self._ho.get_wavelength()
            wavelength = round(float(wavelength), self._precision)
            wavelength = ("{:2.%sf}" % self._precision).format(wavelength)
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

        return wavelength

    def state(self):
        """
        state = MOTOR_STATE.READY

        try:
            state = MOTOR_STATE.READY if self._ho.is_ready() else MOTOR_STATE.MOVING
        except BaseException:
            pass
        """
        state = self._ho.get_state()
        return state

    def stop(self):
        self._ho.stop()

    def limits(self):
        """
        :returns: The limits.
        """
        try:
            energy_limits = self._ho.get_wavelength_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

        return energy_limits

    def read_only(self):
        return not self._ho.tunable


class DuoStateHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        super(DuoStateHOAdapter, self).__init__(ho, name)
        self._connect_signals(ho)

    def _connect_signals(self, ho):
        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            self._STATES = MICRODIFF_INOUT_STATE
            ho.connect("actuatorStateChanged", self.state_change)
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            ho.connect("value_changed", self.state_change)
            self._STATES = MICRODIFF_INOUT_STATE
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
            state = self._ho.getActuatorState()
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            state = self._ho.get_value()
        elif isinstance(self._ho, TangoShutter.TangoShutter) or isinstance(
            self._ho, ShutterMockup.ShutterMockup
        ):
            state = self._ho.state_value_str
        elif isinstance(self._ho, MicrodiffBeamstop.MicrodiffBeamstop):
            state = self._ho.getPosition()
        elif isinstance(self._ho, MicrodiffInOutMockup.MicrodiffInOutMockup):
            state = self._ho.getActuatorState()

        state = self._STATES.TO_INOUT_STATE.get(state, INOUT_STATE.UNDEFINED)
        return state

    def _close(self):
        if isinstance(self._ho, MicrodiffInOut.MicrodiffInOut):
            self._ho.actuatorOut()
        elif isinstance(self._ho, AbstractNState.AbstractNState):
            self._ho.set_value(AbstractNState.InOutEnum.IN)
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
            self._ho.set_value(AbstractNState.InOutEnum.OUT)
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

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
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
        super(TransmissionHOAdapter, self).__init__(ho, name)
        ho.connect("attFactorChanged", self.state_change)
        ho.connect("valueChanged", self._value_change)
        self._precision = 3

    def limits(self):
        """
        :returns: The transmission limits.
        """
        try:
            trans_limits = self._ho.get_limits()
        except (AttributeError, TypeError):
            trans_limits = (0, 100)
            raise ValueError("Could not get limits")

        return trans_limits

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
        try:
            self._ho.set_value(round(float(value), 2))
        except Exception as ex:
            raise ValueError("Can't set transmission: %s" % str(ex))

        return self.get()

    def get(self):
        try:
            transmission = self._ho.get_value()
            transmission = round(float(transmission), self._precision)
            transmission = ("{:3.%sf}" % self._precision).format(transmission)
        except (AttributeError, TypeError):
            transmission = 0

        return transmission

    def state(self):
        return HardwareObjectState.READY if self._ho.is_ready() else HardwareObjectState.BUSY


class ResolutionHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        super(ResolutionHOAdapter, self).__init__(ho, name)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)
        self._precision = 3

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
        self._ho.set_value(round(float(value), 3))
        return self.get()

    def get(self):
        try:
            resolution = self._ho.get_value()
            resolution = round(float(resolution), self._precision)
            resolution = ("{:2.%sf}" % self._precision).format(resolution)
        except (TypeError, AttributeError):
            resolution = 0
        return resolution

    def limits(self):
        """
        :returns: The resolution limits.
        """
        try:
            resolution_limits = self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

        return resolution_limits

    def stop(self):
        self._ho.stop()

    def state(self):
        state = self._ho.get_state()
        if isinstance(state, list):
            return state[0]
        return state

    def get_lookup_limits(self):
        return self.limits()

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {
            "name": self._name,
            "label": self._name.replace("_", " ").title(),
            "value": self.get(),
            "limits": self.get_lookup_limits(),
            "state": self.state().name,
            "msg": self.msg(),
            "precision": self.precision(),
            "step": self.step_size(),
            "readonly": self.read_only(),
        }
        return data


class DetectorDistanceHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        super(DetectorDistanceHOAdapter, self).__init__(ho, name)
        ho.connect("valueChanged", self._value_change)
        ho.connect("stateChanged", self.state_change)

        self._precision = 3

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
        self._ho.set_value(round(float(value), 3))
        return self.get()

    def get(self):
        try:
            detdist = self._ho.get_value()
            detdist = round(float(detdist), self._precision)
            detdist = ("{:4.%sf}" % self._precision).format(detdist)
        except (TypeError, AttributeError):
            detdist = 0

        return detdist

    def limits(self):
        """
        :returns: The detector distance limits.
        """
        try:
            detdist_limits = self._ho.get_limits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

        return detdist_limits

    def stop(self):
        self._ho.stop()

    def state(self):
        state = self._ho.get_state()
        if isinstance(state, list):
            return state[0]
        return state


class MachineInfoHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
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
            current = -1

        return current

    def get_fill_mode(self):
        try:
            fmode = self._ho.getFillMode()
        except (TypeError, AttributeError):
            fmode = ""

        return fmode

    def limits(self):
        """
        :returns: The detector distance limits.
        """
        return []

    def stop(self):
        pass

    def state(self):
        return HardwareObjectState.UNKNOWN


class PhotonFluxHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
        super(PhotonFluxHOAdapter, self).__init__(ho, name)

        try:
            ho.connect("valueChanged", self._value_change)
        except BaseException:
            pass

        self._precision = 1

    @utils.RateLimited(6)
    def _value_change(self, *args, **kwargs):
        self.value_change(*args, **kwargs)

    def set(self, value):
        pass

    def get(self):
        try:
            value = self._ho.current_flux
        except BaseException:
            value = "0"

        return value

    def message(self):
        return ""

    def limits(self):
        """
        :returns: The detector distance limits.
        """
        return []

    def state(self):
        return HardwareObjectState.READY

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {
            "name": self._name,
            "label": self._name.replace("_", " ").title(),
            "value": self.get(),
            "limits": self.limits(),
            "state": self.state().name,
            "msg": self.message(),
            "precision": self.precision(),
            "readonly": self.read_only(),
        }

        return data


class CryoHOAdapter(HOActuatorAdapterBase):
    def __init__(self, ho, name=""):
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

    def set(self, value):
        pass

    def get(self):
        try:
            value = self._ho.get_value()
        except Exception:
            value = "0"

        return value

    def message(self):
        return ""

    def limits(self):
        """
        :returns: The detector distance limits.
        """
        return []

    def state(self):
        return HardwareObjectState.READY

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {
            "name": self._name,
            "label": self._name.replace("_", " ").title(),
            "value": self.get(),
            "limits": self.limits(),
            "state": self.state().name,
            "msg": self.message(),
            "precision": self.precision(),
            "readonly": self.read_only(),
        }

        return data


class DataPublisherHOAdapter(HOAdapterBase):
    def __init__(self, ho, name=""):
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
        return HardwareObjectState.READY


class _BeamlineAdapter(object):
    """
    Adapter between Beamline route and Beamline hardware object.
    """

    _ADAPTER_MAP = {
        "energy": ("energy", EnergyHOAdapter),
        "wavelength": ("energy", WavelengthHOAdapter),
        "resolution": ("resolution", ResolutionHOAdapter),
        "transmission": ("transmission", TransmissionHOAdapter),
        "fast_shutter": ("fast_shutter",DuoStateHOAdapter),
        "safety_shutter": ("safety_shutter", DuoStateHOAdapter),
        "machine_info": ("machine_info", MachineInfoHOAdapter),
        "flux": ("flux", PhotonFluxHOAdapter),
        "data_publisher": ("data_publisher", DataPublisherHOAdapter),
        "cryo": ("diffractometer.cryo", CryoHOAdapter),
        "capillary": ("diffractometer.capillary", DuoStateHOAdapter),
        "beamstop": ("diffractometer.beamstop", DuoStateHOAdapter),
        "detector_distance": ("detector.detetor_distance", DetectorDistanceHOAdapter)
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
        "detector_distance"
    ]

    def __init__(self, beamline_hwobj):
        self._bl = beamline_hwobj
        self._ho_dict = {}

        workflow = self._bl.workflow
    
        for role, mapping in self._ADAPTER_MAP.items():
            attr_path, adapter = mapping
            attr = None

            try:
                attr = self._getattr(self._bl, attr_path)
            except:
                logging.getLogger("MX3.HWR").info("Could not add adapter for %s" % role)
            else:
                if attr:
                    setattr(self, role, adapter(attr))
                    logging.getLogger("MX3.HWR").info("Added adapter for %s" % role)

        if workflow:
            workflow.connect("parametersNeeded", self.wf_parameters_needed)

    def _getattr(self, obj, attr):
        """Recurses through an attribute chain to get the attribute."""
        return reduce(getattr, attr.split('.'), obj)

    def wf_parameters_needed(self, params):
        socketio.emit("workflowParametersDialog", params, namespace="/hwr")

    def get_object(self, name):
        return getattr(self, name)

    def dict_repr(self):
        """
        :returns: Dictionary value-representation for each beamline attribute listed in _TO_SERIALIZE
        """
        attributes = {}

        for attr_name in self._TO_SERIALIZE:
            try:
                _d = getattr(self, attr_name).dict_repr()
                attributes.update({attr_name: _d})
            except Exception:
                logging.getLogger("MX3.HWR").error("Failed to get dictionary representation of %s" % attr_name)
      
        return {"attributes": attributes}

    def get_available_methods(self):
        return self._bl.available_methods

    def get_available_elements(self):
        escan = self._bl.energy_scan
        elements = []

        if escan:
            elements = escan.getElements()

        return {"elements": elements}

    def get_acquisition_limit_values(self):
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