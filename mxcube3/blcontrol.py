import sys
import logging
import traceback
import pickle

from os import path

import QueueManager

HWR = None
beamline = None
xml_rpc_server = None
actions = None
plotting = None
session = None
collect = None
workflow = None
shapes = None
diffractometer = None
db_connection = None
sample_changer = None
sc_maintenance = None
rest_lims = None
empty_queue = None
qm = None


def get_hwo(obj, name):
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
    logging.getLogger("HWR").error(traceback.format_exc())

    if msg:
        logging.getLogger("HWR").error(msg)

    msg = "Could not initialize one or several hardware objects, stopped "
    msg += "at first error !"

    logging.getLogger("HWR").error(msg)
    logging.getLogger("HWR").error("Quitting server !")
    sys.exit(-1)


def init(hwr, hwdir):
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
