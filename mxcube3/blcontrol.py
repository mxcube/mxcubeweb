"""
Module that provides access to the underlying beamline control layer,
HardwareRepository. The HardwareRepository consists of several HardwareObjects
that can be directly accessed through this module. See the list of
HardwareObjects that are "exported" below.
"""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import sys
import logging
import traceback
import pickle

from os import path

import QueueManager

class MXCUBECore():
    # The HardwareRepository object
    HWR = None

    # Below, all the HardwareObjects made available through this module,
    # Initialized by the init function

    # BeamlineSetup
    beamline = None
    # XMLRPCServer
    actions = None
    # Plotting
    plotting = None

    @staticmethod
    def get_hwo(obj, name):
        """
        Convenience method for getting HardwareObjects from the HardwareRepository.
        Retrieves the HardwareObject with the name <name> from either the
        HardwareRepository or from a parent HardwareObject passed as <obj>

        Handles exceptions with exit_with_error, which means that the application
        will exit on exception

        :param obj: HardwreObject or HardwareRepository
        :param str name: The name of the HardwreObject

        :rtype: HardwareObject
        :return: The HardwareObject
        """
        ho = None

        try:
            if hasattr(obj, "get_hardware_object"):
                ho = obj.get_hardware_object(name)
            else:
                ho = obj.get_object_by_role(name)
        except Exception:
            msg = "Could not initialize hardware object corresponding to %s \n"
            msg = msg % name.upper()
            msg += "Make sure that all related device servers are running \n"
            msg += "Make sure that the detector software is running \n"

            MXCUBECore.exit_with_error(msg)

        return ho

    @staticmethod
    def exit_with_error(msg):
        """
        Writes the traceback and msg to the log and exits the application

        :param str msg: Additional message to write to log

        """

        logging.getLogger("HWR").error(traceback.format_exc())

        if msg:
            logging.getLogger("HWR").error(msg)

        msg = "Could not initialize one or several hardware objects, stopped "
        msg += "at first error !"

        logging.getLogger("HWR").error(msg)
        logging.getLogger("HWR").error("Quitting server !")
        sys.exit(-1)

    @staticmethod
    def init(hwr, hwdir):
        """
        Initializes the HardwareRepository with XML files read from hwdir.

        The hwr module must be imported at the very beginning of the application
        start-up to function correctly.

        This method can however be called later, so that initialization can be
        done when one wishes.

        :param hwr: HardwareRepository module
        :param str hwdir: Path to hardware objects

        :return: None
        """
        try:
            hwr.init_hardware_repository(path.abspath(path.expanduser(hwdir)))
            _hwr = hwr.get_hardware_repository()
            _hwr.connect()
            HWR = _hwr
        except Exception:
            logging.getLogger("HWR").exception("")
        try:
            MXCUBECore.beamline = hwr.beamline

            qm = QueueManager.QueueManager("MXCuBE3")

            from mxcube3.core import qutils

            qutils.init_signals(hwr.beamline.queue_model)

        except Exception:
            msg = "Could not initialize one or several hardware objects, "
            msg += "stopped at first error ! \n"
            msg += "Make sure That all devices servers are running \n"
            msg += "Make sure that the detector software is running \n"
            MXCUBECore.exit_with_error(msg)
