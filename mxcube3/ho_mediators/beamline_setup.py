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
        energy =  self.getObjectByRole("energy").get()
        transmission = self.getObjectByRole("transmission").get()
        resolution = self.getObjectByRole("resolution").get()

        data = {"energy": {"name": "energy",
                           "value": energy,
                           "limits": (0, 1000, 0.1)},
                "transmission": {"name": "transmission",
                                 "value": transmission,
                                 "limits": (0, 1000, 0.1)},
                "resolution": {"name": "resolution",
                               "value": resolution,
                               "limits": (0, 1000, 0.1)}}

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


    def value_change(self, energy, wavelength):
        socketio.emit("value_change", energy, namespace='/beamline/energy')


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
