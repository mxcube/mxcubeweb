# -*- coding: utf-8 -*-
from mxcube3 import socketio
from mxcube3 import app as mxcube

from .statedefs import (MOTOR_STATE, INOUT_STATE)
import logging
from numpy import arange
import math

BEAMLINE_SETUP = None

# Singleton like interface is needed to keep the same referance to the
# mediator object and its corresponding hardware objects, so that the signal
# system wont cleanup signal handlers. (PyDispatcher removes signal handlers
# when a object is garbage collected)
def BeamlineSetupMediator(*args):
    global BEAMLINE_SETUP

    if BEAMLINE_SETUP is None:
        BEAMLINE_SETUP = _BeamlineSetupMediator(*args)

    return BEAMLINE_SETUP


class _BeamlineSetupMediator(object):
    """
    Mediator between Beamline route and BeamlineSetup hardware object.
    Providing missing functionality while the HardwareObjects are frozen. The
    functionality should eventually be included in the hardware objects or
    other suitable places once the UI part have stabilized.
    """
    def __init__(self, beamline_setup):
        self._bl = beamline_setup
        self._ho_dict = {}

        workflow = self.getObjectByRole("workflow")

        if workflow:
            workflow.connect("parametersNeeded", self.wf_parameters_needed)

    def wf_parameters_needed(self, params):
        socketio.emit("workflowParametersDialog", params, namespace="/hwr")

    def getObjectByRole(self, name):
        try:
            if name == "dtox":
                # Detector distance retrieved through resolution
                ho = self._bl.getObjectByRole("resolution")
            elif name == "wavelength":
                # Wavelength rerieved trhough energy
                ho = self._bl.getObjectByRole("energy")
            else:
                ho = self._bl.getObjectByRole(name.lower())
        except Exception:
            msg = "Failed to get object with role: %s" % name
            logging.getLogger("HWR").exception(msg)

        if name == "energy":
            return self._ho_dict.setdefault(name, EnergyHOMediator(ho, "energy"))
        elif name == "wavelength":
            return self._ho_dict.setdefault(name, WavelengthHOMediator(ho, "wavelength"))
        elif name == "resolution":
            return self._ho_dict.setdefault(name, ResolutionHOMediator(ho, "resolution"))
        elif name == "transmission":
            return self._ho_dict.setdefault(name, TransmissionHOMediator(ho, "transmission"))
        elif name == "fast_shutter":
            return self._ho_dict.setdefault(name, InOutHOMediator(ho, "fast_shutter"))
        elif name == "safety_shutter":
            return self._ho_dict.setdefault(name, InOutHOMediator(ho, "safety_shutter"))
        elif name == "beamstop":
            return self._ho_dict.setdefault(name, InOutHOMediator(ho, "beamstop"))
        elif name == "capillary":
            return self._ho_dict.setdefault(name, InOutHOMediator(ho, "capillary"))
        elif name == "dtox":
            return self._ho_dict.setdefault(name, DetectorDistanceHOMediator(ho, "detdist"))
        elif name == "mach_info":
            return self._ho_dict.setdefault(name, MachineInfoHOMediator(ho, "machinfo"))
        else:
            return ho

    def dict_repr(self):
        """
        :returns: Dictionary value-representation for each beamline attribute
        """
        attributes = {}

        try:
            energy = self.getObjectByRole("energy")
            attributes.update({"energy": energy.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get energy info")

        try:
            wavelength = self.getObjectByRole("wavelength")
            attributes.update({"wavelength": wavelength.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get energy info")
        try:
            transmission = self.getObjectByRole("transmission")
            attributes.update({"transmission": transmission.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get transmission info")

        try:
            resolution = self.getObjectByRole("resolution")
            attributes.update({"resolution": resolution.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get resolution info")

        try:
            fast_shutter = self.getObjectByRole("fast_shutter")
            attributes.update({"fast_shutter": fast_shutter.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get fast_shutter info")

        try:
            safety_shutter = self.getObjectByRole("safety_shutter")
            attributes.update({"safety_shutter": safety_shutter.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get safety_shutter info")

        try:
            beamstop = self.getObjectByRole("beamstop")
            attributes.update({"beamstop": beamstop.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get beamstop info")

        try:
            detdist = self.getObjectByRole("dtox")
            attributes.update({"detdist": detdist.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get detdist info")

        try:
            machinfo = self.getObjectByRole("mach_info")
            attributes.update({"machinfo": machinfo.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get mach_info info")

        try:
            flux = self.getObjectByRole("flux")
            attributes.update({"flux": flux.dict_repr()})
        except Exception:
            logging.getLogger("HWR").exception("Failed to get photon flux")
        # Flux hardcoded for now to be connected later
        attributes.update({"flux": {"name": "flux",
                                    "label": "Flux",
                                    "value": 0,
                                    "limits": [0, 1000, 0, 1],
                                    "state": "READY",
                                    "msg": "",
                                    "type": "FLOAT"}})

        return {"attributes": attributes}



class HOMediatorBase(object):
    def __init__(self, ho, name=""):
        """
        :param HardwareObject ho: Hardware object to mediate for.
        :returns: None
        """
        self._ho = ho
        self._name = name
        self._precision = 1

    def precision(self):
        return self._precision

    def step_size(self):
        return math.pow(10, -self._precision)

    def __getattr__(self, attr):
        if attr.startswith("__"):
            raise AttributeError(attr)

        return getattr(self._ho, attr)

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
        pass

    # Abstract method
    def get(self):
        """
        Retrieves value from underlying hardware object.

        :returns: The value
        :rtype: float
        :raises ValueError: When value for any reason can't be retrieved
        """
        pass

    # Abstract method
    def state(self):
        """
        Retrieves the state of the underlying hardware object.

        :returns: The state
        :rtype: str
        """
        return ""

    # Abstract method
    def stop(self):
        """
        Stops a action/movement

        :returns: None
        :rtype: None
        """
        pass

    # Abstract method
    def limits(self):
        """
        :returns: The limits and default stepsize of the device, on the format
                  (upper, lower, step)
        """
        return (0, 1, 1)

    # Abstract method
    def msg(self):
        """
        :returns: Returns a message describing the current state, should be 
                  used to communicate details of the state to the user.

        :rtype: str
        """
        return ""

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {"name": self._name,
                "label": self._name.replace('_', ' ').title(),
                "value": self.get(),
                "limits": self.limits(),
                "state": self.state(),
                "msg": self.msg(),
                "type": "FLOAT",
                "precision": self.precision(),
                "step": self.step_size()
                }

        return data

    def value_change(self, *args):
        """
        Signal handler to be used for sending values to the client via 
        socketIO, data should normally be sent in the "hwr" namespace.
        """
        socketio.emit("beamline_value_change", self.dict_repr(), namespace="/hwr")


class EnergyHOMediator(HOMediatorBase):
    """
    Mediator for Energy Hardware Object, a web socket is used communicate
    information on longer running processes.
    """
    def __init__(self, ho, name=''):
        super(EnergyHOMediator, self).__init__(ho, name)
        ho.connect("energyChanged", self.value_change)
        self._precision = 4

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
            self._ho.start_move_energy(float(value))
            res = self.get()
        except:
            raise

        return res

    def get(self):
        """
        :returns: The value
        :rtype: float
        :raises ValueError: When value for any reason can't be retrieved
        """
        try:
            energy = self._ho.getCurrentEnergy()
            energy = round(float(energy), self._precision)
            energy = ("{:3.%sf}" % self._precision).format(energy)
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

        return energy

    def state(self):
        state = MOTOR_STATE.READY

        try:
            state = self._ho.energy_motor.getState()
        except:
            pass

        return state

    def stop(self):
        self._ho.stop()

    def limits(self):
        """
        :returns: The energy limits.
        """
        try:
            energy_limits = self._ho.getEnergyLimits()
        except (AttributeError, TypeError):
            energy_limits = (0, 50)
            raise ValueError("Could not get limits")

        return energy_limits

class WavelengthHOMediator(HOMediatorBase):
    """
    Mediator for wavelength Hardware Object, a web socket is used communicate
    information on longer running processes.
    """
    def __init__(self, ho, name=''):
        super(WavelengthHOMediator, self).__init__(ho, name)
        ho.connect("energyChanged", self.value_change)
        self._precision = 4


    def set(self, value):
        """
        :param value: Value (castable to float) to set

        :raises ValueError: When value for any reason can't be retrieved
        :raises StopItteration: When a value change was interrupted
                                (aborted or cancelled)

        :returns: The actual value set
        :rtype: float
        """
        try:
            self._ho.start_move_energy(12.3984 / float(value))
            res = self.get()
        except:
            raise

        return res

    def get(self):
        """
        :returns: The value
        :rtype: float
        :raises ValueError: When value for any reason can't be retrieved
        """
        try:
            wavelength = self._ho.getCurrentWavelength()
            wavelength = round(float(wavelength), self._precision)
            wavelength = ("{:2.%sf}" % self._precision).format(wavelength)
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

        return wavelength

    def state(self):
        state = MOTOR_STATE.READY

        try:
            state = self._ho.getState()
        except:
            pass

        return state

    def stop(self):
        self._ho.stop()

    def limits(self):
        """
        :returns: The limits.
        """
        try:
            energy_limits = self._ho.getWavelengthLimits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

        return energy_limits


class InOutHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(InOutHOMediator, self).__init__(ho, name)
        ho.connect("actuatorStateChanged", self.value_change)

    def _get_state(self):

        # Try to use the "native" HardwareObject getActuatorState API, try
        # the TangoShutter API if it fails, finally try a the third way
        # getState used by for instance beamstops.
        if hasattr(self._ho, "getActuatorState"):
            state = self._ho.getActuatorState()
        elif hasattr(self._ho, "state_value_str"):
            state = self._ho.state_value_str
        elif hasattr(self._ho, "getState"):
            state = self._ho.getState()
        else:
            state = INOUT_STATE.UNDEFINED

        return state

    def _close(self):
        # Try the three different variants of close, Actuator interface,
        # shutter interface and beamstop moveToPosition interface.
        if hasattr(self._ho, "actuatorIn"):
            self._ho.actuatorIn()
        elif hasattr(self._ho, "closeShutter"):
            self._ho.closeShutter()
        elif hasattr(self._ho, "moveToPosition"):
            self._ho.moveToPosition("BEAM")

    def _open(self):
        # Try the three different variants of open (see _close and _get_state)
        if hasattr(self._ho, "actuatorOut"):
            self._ho.actuatorIn()
        elif hasattr(self._ho, "openShutter"):
            self._ho.closeShutter()
        elif hasattr(self._ho, "moveToPosition"):
            self._ho.moveToPosition("OFF")

    def set(self, state):
        if state == INOUT_STATE.IN:
            self._ho.actuatorIn()
        elif state == INOUT_STATE.OUT:
            self._ho.actuatorOut()


    def get(self):
        return INOUT_STATE.STR_TO_VALUE.get(self._get_state(), 2)

    def stop(self):
        self._ho.stop()

    def state(self):
        return self._get_state()

    def msg(self):
        state = self._get_state()
        msg = "UNKNOWN"

        if state == INOUT_STATE.IN:
            msg = "OPENED"
        elif state == INOUT_STATE.OUT:
            msg = "CLOSED"

        return msg

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {"name": self._name,
                "label": self._name.replace('_', ' ').title(),
                "value": self.get(),
                "limits": self.limits(),
                "state": self.state(),
                "msg": self.msg(),
                "commands": ["Open", "Close"],
                "type": "DUOSTATE"
                }

        return data


class TangoShutterHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(TangoShutterHOMediator, self).__init__(ho, name)
        ho.connect("shutterStateChanged", self.value_change)

    def __getattr__(self, attr):
        return getattr(self._ho, attr)

    def set(self, state):
        if state == INOUT_STATE.IN:
            self._ho.closeShutter()
        elif state == INOUT_STATE.OUT:
            self._ho.openShutter()

    def get(self):
        return 0

    def stop(self):
        self._ho.stop()

    def state(self):
        state = INOUT_STATE.UNDEFINED
        _state = self._ho.getShutterState()

        if _state == "OPENED":
            state = INOUT_STATE.OUT
        elif _state == "CLOSED":
            state = INOUT_STATE.IN

        return state

    def msg(self):
        state = self._ho.getShutterState()
        msg = "UNKNOWN"

        if state == INOUT_STATE.IN:
            msg = "IN"
        elif state == INOUT_STATE.OUT:
            msg = "OUT"

        return msg

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {"name": self._name,
                "label": self._name.replace('_', ' ').title(),
                "value": self.get(),
                "limits": self.limits(),
                "state": self.state(),
                "msg": self.msg(),
                "commands": ["Open", "Close"],
                "type": "DUOSTATE"
                }

        return data


class BeamstopHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(BeamstopHOMediator, self).__init__(ho, name)
        ho.connect("stateChanged", self.value_change)

    def __getattr__(self, attr):
        return getattr(self._ho, attr)

    def set(self, state):
        if state == INOUT_STATE.IN:
            self._ho.moveToPosition(state)
        elif state == INOUT_STATE.OUT:
            self._ho.moveToPosition(state)

    def get(self):
        return 0

    def stop(self):
        self._ho.stop()

    def state(self):
        state = INOUT_STATE.UNDEFINED
        _state = self._ho.getPosition()

        if _state == INOUT_STATE.OUT:
            state = INOUT_STATE.OUT
        elif _state == INOUT_STATE.IN:
            state = INOUT_STATE.IN

        return state

    def msg(self):
        state = self._ho.getPosition()
        msg = "UNKNOWN"

        if state == INOUT_STATE.IN:
            msg = "IN"
        elif state == INOUT_STATE.OUT:
            msg = "OUT"

        return msg

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {"name": self._name,
                "label": self._name.replace('_', ' ').title(),
                "value": self.get(),
                "limits": self.limits(),
                "state": self.state(),
                "msg": self.msg(),
                "commands": ["In", "Out"],
                "type": "DUOSTATE"
                }

        return data

    def value_change(self, value):
        socketio.emit("beamline_value_change", self.dict_repr(), namespace="/hwr")


class TransmissionHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(TransmissionHOMediator, self).__init__(ho, name)
        ho.connect("attFactorChanged", self.value_change)
        self._precision = 2

    def set(self, value):
        try:
            self._ho.set_value(round(float(value), 2))
        except Exception as ex:
            raise ValueError("Can't set transmission: %s" % str(ex))

        return self.get()

    def get(self):
        try:
            transmission = self._ho.getAttFactor()
            transmission = round(float(transmission), self._precision)
            transmission = ("{:3.%sf}" % self._precision).format(transmission)
        except (AttributeError, TypeError):
            transmission = 0

        return transmission

    def stop(self):
        self._ho.stop()

    def state(self):
        return MOTOR_STATE.READY if self._ho.isReady() else MOTOR_STATE.MOVING


class ResolutionHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(ResolutionHOMediator, self).__init__(ho, name)
        ho.connect("valueChanged", self.value_change)
        self._precision = 3

    def set(self, value):
        self._ho.move(round(float(value), 3))
        return self.get()

    def get(self):
        try:
            resolution = self._ho.getPosition()
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
            resolution_limits = self._ho.getLimits()
        except (AttributeError, TypeError):
            raise ValueError("Could not get limits")

        return resolution_limits

    def stop(self):
        self._ho.stop()

    def state(self):
        return MOTOR_STATE.VALUE_TO_STR.get(self._ho.getState(), 0)

    def _calc_res(self, radius, energy, dist):
        current_wavelength = 12.3984 / energy

        try:
            ttheta = math.atan(radius / float(dist))
            if ttheta != 0:
                return current_wavelength / (2 * math.sin(ttheta / 2))
            else:
                return 0
        except Exception:
            logging.getLogger().exception("error while calculating resolution")
            return 0

    def get_lookup_limits(self):
        e_min, e_max = self._ho.energy.getEnergyLimits()

        limits = []
        x = arange(float(e_min), float(e_max), 0.5)

        radius = self._ho.det_radius
        det_dist = self.dtox

        pos_min, pos_max = det_dist.getLimits()

        for energy in x:
            res_min, res_max = self._calc_res(radius, energy, pos_min),\
                self._calc_res(radius, energy, pos_max)
            limits.append((energy, res_min, res_max))

        return limits

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {"name": self._name,
                "label": self._name.replace('_', ' ').title(),
                "value": self.get(),
                "limits": self.get_lookup_limits(),
                "state": self.state(),
                "msg": self.msg(),
                "precision": self.precision(),
                "step": self.step_size()
                }

        return data


class DetectorDistanceHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(DetectorDistanceHOMediator, self).__init__(ho, name)
        ho.dtox.connect("positionChanged", self.value_change)
        ho.dtox.connect("stateChanged", self.value_change)

        self._precision = 3

    def set(self, value):
        self._ho.dtox.move(round(float(value), 3))
        return self.get()

    def get(self):
        try:
            detdist = self._ho.dtox.getPosition()
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
            detdist_limits = self._ho.dtox.getLimits()
        except (AttributeError, TypeError) as ex:
            raise ValueError("Could not get limits")

        return detdist_limits

    def stop(self):
        self._ho.dtox.stop()

    def state(self):
        return MOTOR_STATE.VALUE_TO_STR.get(self._ho.dtox.getState(), "READY")


class MachineInfoHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(MachineInfoHOMediator, self).__init__(ho, name)
        ho.connect("valueChanged", self.value_change)
        self._precision = 1

    def set(self, value):
        pass

    def get(self):
        return {"current": self.get_current(),
                "message": self.get_message(),
                "fillmode": self.get_fill_mode()}


    def get_message(self):
        try:
            message = self._ho.getMessage()
        except (TypeError, AttributeError):
            message = ""

        return message

    def get_current(self):
        try:
            current = self._ho.getCurrent()
            current = current if isinstance(current, str) else \
                "{:.1f} mA".format(round(float(self._ho.getCurrent()), 1))
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
        pass


class PhotonFluxHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(PhotonFluxHOMediator, self).__init__(ho, name)
        ho.connect("valueChanged", self.value_change)
        self._precision = 1

    def set(self, value):
        pass

    def get(self):
        return self._ho.current_flux

    def message(self):
        return ""

    def limits(self):
        """
        :returns: The detector distance limits.
        """
        return []

    def state(self):
        return "READY"

    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {"name": self._name,
                "label": self._name.replace('_', ' ').title(),
                "value": self.get(),
                "limits": self.limits(),
                "state":  self.state(),
                "msg": self.message(),
                "precision": self.precision()}

        return data
