# -*- coding: utf-8 -*-
from mxcube3 import socketio
from .statedefs import (MOTOR_STATE, INOUT_STATE)


BEAMLINE_SETUP = None

# Sinlgeton like interface is needed to keep the same referance to the 
# mediator object and its corresponding hardware objects, so that the signal
# system wont cleanup signal handlers. (PyDispatcher removes signal handlers
# when a object is garabge collected)
def BeamlineSetupMediator(*args):
    global BEAMLINE_SETUP

    if BEAMLINE_SETUP is None:
        BEAMLINE_SETUP = _BeamlineSetupMediator(*args)

    return BEAMLINE_SETUP


class _BeamlineSetupMediator(object):
    """
    Mediator between Beamline route and BeamlineSetup hardware object. Providing
    missing functionality while the HardwareObjects are frozen. The
    functionality should eventually be included in the hardware objects or other
    suitable places once the UI part have stabilized.
    """
    def __init__(self, beamline_setup):
        self._bl = beamline_setup
        self._ho_dict = {}


    def getObjectByRole(self, name):
        ho = self._bl.getObjectByRole(name.lower())

        if name == "energy":
            return self._ho_dict.setdefault(name, EnergyHOMediator(ho, "energy"))
        elif name == "resolution":
            return self._ho_dict.setdefault(name, ResolutionHOMediator(ho, "resolution"))
        elif name == "transmission":
            return self._ho_dict.setdefault(name, TransmissionHOMediator(ho, "transmission"))
        elif name == "fast_shutter":
            return self._ho_dict.setdefault(name, InOutHOMediator(ho, "fast_shutter"))
        elif name == "safety_shutter":
            return self._ho_dict.setdefault(name, TangoShutterHOMediator(ho, "safety_shutter"))
        elif name == "beamstop":
            return self._ho_dict.setdefault(name, BeamstopHOMediator(ho, "beamstop"))
        elif name == "capillary":
            return self._ho_dict.setdefault(name, InOutHOMediator(ho, "capillary"))
        else:
            return ho


    def dict_repr(self):
        """
        :returns: Dictionary value-representation for each beamline attribute
        """
        energy =  self.getObjectByRole("energy")
        transmission = self.getObjectByRole("transmission")
        resolution = self.getObjectByRole("resolution")
        fast_shutter = self.getObjectByRole("fast_shutter")
        safety_shutter = self.getObjectByRole("safety_shutter")
        beamstop = self.getObjectByRole("beamstop")
#        capillary = self.getObjectByRole("capillary")

        data = {"energy": energy.dict_repr(),
                "transmission": transmission.dict_repr(),
                "resolution": resolution.dict_repr(),
                "fast_shutter": fast_shutter.dict_repr(),
                "safety_shutter": safety_shutter.dict_repr(),
#                "capillary": capillary.dict_repr(),
                "beamstop": beamstop.dict_repr()}

        return data


class HOMediatorBase(object):
    def __init__(self, ho, name=''):
        """
        :param HardwareObject ho: Hardware object to mediate for.
        :returns: None
        """
        self._ho = ho
        self._name = name


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
        (aborted or cancelled)

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
        :returns: Returns a message describing the current state, should be used
                  to communicate details of the state to the user.

        :rtype: str
        """
        return ""


    def dict_repr(self):
        """
        :returns: The dictionary representation of the hardware object.
        """
        data = {"name": self._name,
                "value": self.get(),
                "limits":self.limits(),
                "state": self.state(),
                "msg": self.msg()}

        return data


    def value_change(self, *args):
        """
        Signal handler to be used for sending values to the client via socketIO,
        data should normally be sent in the "hwr" namespace.
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
            energy = round(float(energy), 4)
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


class InOutHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(InOutHOMediator, self).__init__(ho, name)
        ho.connect("actuatorStateChanged", self.value_change)

    def set(self, state):
        if state == INOUT_STATE.IN:
            self._ho.actuatorIn()
        elif state == INOUT_STATE.OUT:
            self._ho.actuatorOut()


    def get(self):
        return INOUT_STATE.STR_TO_VALUE.get(self._ho.getActuatorState(), 2)


    def stop(self):
        self._ho.stop()


    def state(self):
        return self._ho.getActuatorState()


    def msg(self):
        state = self._ho.getActuatorState()
        msg = "UNKNOWN"

        if state == INOUT_STATE.IN:
            msg = "OPENED"
        elif state == INOUT_STATE.OUT:
            msg = "CLOSED"

        return msg


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


    def value_change(self, value):
        socketio.emit("beamline_value_change", self.dict_repr(), namespace="/hwr")


class TransmissionHOMediator(HOMediatorBase):
    def __init__(self, ho, name=''):
        super(TransmissionHOMediator, self).__init__(ho, name)
        ho.connect("attFactorChanged", self.value_change)


    def set(self, value):
        try:
            self._ho.set_value(round(float(value), 2))
        except Exception as ex:
            raise ValueError("Can't set transmission: %s" % str(ex))

        return self.get()


    def get(self):
        try:
            transmission = self._ho.getAttFactor()
            transmission = round(float(transmission), 2)
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


    def set(self, value):
        self._ho.move(round(float(value), 3))
        return self.get()


    def get(self):
        try:
            resolution = self._ho.getPosition()
            resolution = round(float(resolution), 3)
        except (TypeError, AttributeError):
            resolution = 0

        return resolution


    def stop(self):
        self._ho.stop()


    def state(self):
        return MOTOR_STATE.VALUE_TO_STR.get(self._ho.getState(), 0)
