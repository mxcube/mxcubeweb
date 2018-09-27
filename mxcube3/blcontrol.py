"""
Module that provides access to the underlying beamline control layer,
HardwareRepository. The HardwareRepository consists of several HardwareObjects
that can be directly accessed through this module. See the list of
HardwareObjects that are "exported" below.
"""

import sys
import logging
import traceback
import pickle

from os import path

import QueueManager

# The HardwareRepository object
HWR = None


# Below, all the HardwareObjects made available through this module,
# Initialized by the init function

# BeamlineSetup
beamline = None
# XMLRPCServer
xml_rpc_server = None
# BeamCmds
actions = None
# Plotting
plotting = None
# Session
session = None
# Object derived from AbstractCollect or AbstractMultiCollect
collect = None
# Workflow EdnaWorkflow
workflow = None
# Shapes
shapes = None
# Object derived from GenericDiffractometer or MiniDiff
diffractometer = None
# ISPYBClient2
db_connection = None
# Object derived from GenericSampleChanger
sample_changer = None
# FlexHCDMaintenance or CatsMaint
sc_maintenance = None
# ISPYBRestClient
rest_lims = None

# Contains a pickled version of an empty queue, used for re-initialization
empty_queue = None
# Current QueueManager object
qm = None


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
        if hasattr(obj, "getHardwareObject"):
            ho = obj.getHardwareObject(name)
        else:
            ho = obj.getObjectByRole(name)
    except Exception:
        msg = "Could not initialize hardware object corresponding to %s \n"
        msg = msg % name.upper()
        msg += "Make sure that all related device servers are running \n"
        msg += "Make sure that the detector software is running \n"

        exit_with_error(msg)

    return ho


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

    global HWR

    try:
        _hwr = hwr.HardwareRepository(path.abspath(path.expanduser(hwdir)))
        _hwr.connect()
        HWR = _hwr
    except Exception:
        pass

    try:
        global beamline, xml_rpc_server, actions, plotting, session
        global collect, workflow, shapes, diffractometer, db_connection
        global sample_changer, sc_maintenance, rest_lims, empty_queue
        global qm, empty_queue

        bl = get_hwo(_hwr, '/beamline-setup')
        xml_rpc_server = get_hwo(_hwr, 'xml-rpc-server')
        actions = get_hwo(_hwr, '/beamcmds')
        plotting = get_hwo(_hwr, '/plotting')
        empty_queue = pickle.dumps(get_hwo(_hwr, '/queue-model'))

        session = get_hwo(bl, "session")
        collect = get_hwo(bl, "collect")
        workflow = get_hwo(bl, "workflow")
        shapes = get_hwo(bl, "shape_history")
        diffractometer = get_hwo(bl, "diffractometer")
        db_connection = get_hwo(bl, "lims_client")
        sample_changer = get_hwo(bl, "sample_changer")
        sc_maintenance = get_hwo(bl, "sample_changer_maintenance")
        rest_lims = get_hwo(bl, "lims_rest_client")
        beamline = bl

        qm = QueueManager.QueueManager('MXCuBE3')

        from mxcube3.core import qutils
        qutils.new_queue()

    except Exception:
        msg = "Could not initialize one or several hardware objects, "
        msg += "stopped at first error ! \n"
        msg += "Make sure That all devices servers are running \n"
        msg += "Make sure that the detector software is running \n"
        exit_with_error(msg)
