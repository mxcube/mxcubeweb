# -*- coding: utf-8 -*-
from mxcube3 import socketio


class BeamlineSetupMediator(object):
    """
    Mediator between Beamline route and BeamlineSetup hardware object. Providing
    missing functionality while the HardwareObjects are frozen. The
    functionality should eventually be included in the hardware objects or other
    suitable places once the UI part have stabilized.
    """
    def __init__(self, beamline_setup):
        self._bl = beamline_setup


    def getObjectByRole(self, name):
        ho = self._bl.getObjectByRole(name.lower())

        if name == "energy":
            return EnergyHOMediator(ho)
        elif name == "resolution":
            return ResolutionHOMediator(ho)
        elif name == "transmission":
            return TransmissionHOMediator(ho)
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
        
        data = {"energy": {"name": "energy",
                           "value": energy.get(),
                           "limits": (0, 1000, 0.1),
                           "state": energy.state(),
                           "msg": ""
                           },
                "transmission": {"name": "transmission",
                                 "value": transmission.get(),
                                 "limits": (0, 1000, 0.1),
                                 "state": transmission.state(),
                                 "msg": ""},
                "resolution": {"name": "resolution",
                               "value": resolution.get(),
                               "limits": (0, 1000, 0.1),
                               "state": resolution.state(),
                               "msg": ""},
                "fastShutter": {"name": "fastShutter",
                                "value": fast_shutter.getActuatorState(True),
                                "limits": (0, 1, 1),
                                "state": fast_shutter.getActuatorState(True)}}

        return data


class EnergyHOMediator(object):
    """
    Mediator for Energy Hardware Object, a web socket is used communicate
    information on longer running processes.
    """
    def __init__(self, ho):
        """
        :param HardwareObject ho: Hardware object to mediate for.
        :returns: None
        """
        self._ho = ho
        ho.connect("energyChanged", self.value_change)

    def __getattr__(self, attr):
        return getattr(self._ho, attr)


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
        state = "IDLE"

        if self._ho._abort:
            state = "ABORTED"
        elif self._ho.moving:
            state = "BUSY"

        return state


    def value_change(self, energy, wavelength):
        data = {"name": "energy", "value": energy, "state": self.state(), "msg": ""}
        socketio.emit("value_change", data, namespace="/beamline/energy")


class InOutHoMediator(object):
    def __init__(self, ho):
        self._ho = ho
        ho.connect("actuatorStateChanged", self.value_change)


    def __getattr__(self, attr):
        return getattr(self._ho, attr)


    def set(self, value=None):
        state = self._ho.getActuatorState(True)

        if state == "in":
            self._ho.actuatorOut(False)
        elif state == "out":
            self._ho.actuatorIn(False)


    def get(self):
        state = self._ho.getActuatorState(True)

        if state == "in":
            state = True
        else:
            state = False

        return state

    def state(self):
        return self._ho.getActuatorState(True)


    def value_change(self, energy, wavelength):
        data = self.dict_repr()
        socketio.emit("value_change", data, namespace="/beamline/energy")


    def dict_repr(self):
        data = {"name": "fastShutter",
                "value": self.get(),
                "limits": (0, 1, 1),
                "state": self.state()}

        return data



class TransmissionHOMediator(object):
    def __init__(self, ho):
        self._ho = ho

    def __getattr__(self, attr):
        return getattr(self._ho, attr)


    def set(self, value):
        try:
            self._ho.setValue(value, True)
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


    def state(self):
        return "IDLE"


class ResolutionHOMediator(object):
    def __init__(self, ho):
        self._ho = ho

    def __getattr__(self, attr):
        return getattr(self._ho, attr)


    def set(self, value):
        self._ho.newResolution(value)
        return self.get()


    def get(self):
        try:
            resolution = self._ho.getPosition()
            resolution = round(float(resolution), 3)
        except (TypeError, AttributeError):
            resolution = 0

        return resolution


    def state(self):
        return "IDLE"
