# -*- coding: utf-8 -*-
from mxcube3 import socketio

class TransmissionHOMediator(object):
    def __init__(self, ho):
        self._ho = ho

    def __getattr__(self, attr):
        return getattr(self._ho, attr)


    def set(self, value, stream):
        self._ho.setValue(value, True)
        return self.get()


    def get(self):
        try:
            transmission = self._ho.getAttFactor()
            transmission = round(float(transmission), 2)
        except AttributeError:
            transmission = 0
        except TypeError:
            transmission = 0

        return transmission


class ResolutionHOMediator(object):
    def __init__(self, ho):
        self._ho = ho

    def __getattr__(self, attr):
        return getattr(self._ho, attr)


    def set(self, value, stream):
        self._ho.newResolution(value)
        return self.get()


    def get(self):
        try:
            resolution = self._ho.getPosition()
            resolution = round(float(resolution), 3)
        except AttributeError:
            resolution = 0
        except TypeError:
            resolution = 0

        return resolution


class EnergyHOMediator(object):
    def __init__(self, ho):
        self._ho = ho
        ho.connect("energyChanged", self.value_change)

    def __getattr__(self, attr):
        return getattr(self._ho, attr)


    def set(self, value, stream):
        # This might take an arbitrary amount of time to perform so, we need to
        # to inform caller of whats happening !. Use stream to communicate
        # progress.
        self._ho.start_move_energy(float(value))
        return self.get()


    def get(self):
        # The get should return fairly immediately so no special consideration
        # needs to be taken to caller timing out or needs progress info ?.
        try:
            energy = self._ho.getCurrentEnergy()
            energy = round(float(energy), 4)
        except (AttributeError, TypeError):
            raise ValueError("Could not get value")

        return energy

    def value_change(self, energy, wavelength):
        socketio.emit("value_change", energy, namespace='/beamline/energy')


class BeamlineSetupMediator(object):
    """
    Mediator between Beamline route and BeamlineSetup hardware object. Providing
    missing functionality while the HardwareObjects are frozen. The
    functionality should eventually be included in the hardware objects once
    the UI part have stabilized.
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
