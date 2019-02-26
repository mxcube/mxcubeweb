"""
Module that contains application wide settings and state as well as functions
for accessing and manipulating those.
"""

import os
import sys
import logging
import atexit
import json

from logging import StreamHandler, NullHandler
from logging.handlers import TimedRotatingFileHandler

from .HardwareRepository import removeLoggingHandlers
import queue_entry

from mxcube3 import blcontrol

# Below variables used for internal application state

# SampleID and sample data of currently mounted sample
CURRENTLY_MOUNTED_SAMPLE = {}
# Sample location of sample that are in process of being mounted
SAMPLE_TO_BE_MOUNTED = ''
# Method used for sample centring
CENTRING_METHOD = queue_entry.CENTRING_METHOD.LOOP
# Look up table for finding the limsID for a corresponding queueID (QueueNode)
NODE_ID_TO_LIMS_ID = {}
# Initial file list for user, initialized at login, for creating automatic
# run numbers
INITIAL_FILE_LIST = []
# Lookup table for sample changer location to data matrix or
# data matrix to location
SC_CONTENTS = {"FROM_CODE": {}, "FROM_LOCATION": {}}
# Current sample list, with tasks
SAMPLE_LIST = {"sampleList": {}, 'sampleOrder': []}
# Users currently logged in
USERS = {}
# Path to video device (i.e. /dev/videoX)
VIDEO_DEVICE = None
# Contains the complete client side ui state, managed up state_storage.py
UI_STATE = dict()
TEMP_DISABLED = []


# Below variables used for application wide settings

# Enabled or Disable remote usage
ALLOW_REMOTE = False
# Enable timeout gives control (if ALLOW_REMOTE is True)
TIMEOUT_GIVES_CONTROL = False
# Enable automatic Mountie of sample when queue executed in
# "automatic/pipeline" mode
AUTO_MOUNT_SAMPLE = False
# Automatically add and execute diffraction plans coming from
# characterizations
AUTO_ADD_DIFFPLAN = False
# Number of sample snapshots taken before collect
NUM_SNAPSHOTS = 4


def init(hwr, hwr_xml_dir, allow_remote, ra_timeout, video_device, log_fpath):
    """
    Initializes application wide variables, sample video stream, and applies

    :param hwr: HardwareRepository module
    :param str hwr_xml_dir: Path to hardware objects
    :param bool allow_remote: Allow remote usage, True else False
    :param bool ra_timeout: Timeout gives control, True else False
    :param bool video_device: Path to video device

    :return None:
    """
    from mxcube3.core import utils
    from mxcube3.core import *

    global ALLOW_REMOTE, TIMEOUT_GIVES_CONTROL
    ALLOW_REMOTE = allow_remote
    TIMEOUT_GIVES_CONTROL = ra_timeout

    init_logging(log_fpath)

    blcontrol.init(hwr, hwr_xml_dir)

    if os.path.exists(video_device):
        init_sample_video(video_device)

    utils.enable_snapshots(blcontrol.collect, blcontrol.diffractometer)
    init_signal_handlers()

    atexit.register(app_atexit)


def init_sample_video(video_device):
    """
    Initializes video streaming from video device <video_device>, relies on
    v4l2loopback kernel module to write the sample video stream to
    <video_device>.

    The streaming is handled by the streaming module

    :param str video_device: Path to video device, i.e. /dev/videoX

    :return: None
    """

    global VIDEO_DEVICE

    from mxcube3.video import streaming

    try:
        streaming.init(blcontrol.diffractometer.camera, video_device)
    except Exception as ex:
        msg = "Could not initialize video from %s, error was: " % video_device
        msg += str(ex)
        logging.getLogger('HWR').info(msg)
        VIDEO_DEVICE = None
    else:
        VIDEO_DEVICE = video_device


def init_signal_handlers():
    """
    Connects the signal handlers defined in routes/signals.py to the
    corresponding signals/events
    """
    from mxcube3.core import beamlineutils
    from mxcube3.core import sviewutils
    from mxcube3.core import scutils

    try:
        sviewutils.init_signals()
        scutils.init_signals()
        beamlineutils.init_signals()
        beamlineutils.diffractometer_init_signals()
    except Exception:
        sys.excepthook(*sys.exc_info())


def init_logging(log_file):
    """
    :param str log_file: Path to log file

    :return: None
    """

    removeLoggingHandlers()

    fmt = '%(asctime)s |%(name)-7s|%(levelname)-7s| %(message)s'
    log_formatter = logging.Formatter(fmt)

    if log_file:
        log_file_handler =\
            TimedRotatingFileHandler(log_file, when='midnight', backupCount=1)
        os.chmod(log_file, 0o666)
        log_file_handler.setFormatter(log_formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(NullHandler())

    from . import logging_handler
    custom_log_handler = logging_handler.MX3LoggingHandler()
    custom_log_handler.setLevel(logging.DEBUG)
    custom_log_handler.setFormatter(log_formatter)

    exception_logger = logging.getLogger("exceptions")
    hwr_logger = logging.getLogger("HWR")
    mx3_hwr_logger = logging.getLogger("MX3.HWR")
    user_logger = logging.getLogger("user_level_log")
    queue_logger = logging.getLogger("queue_exec")
    stdout_log_handler = StreamHandler(sys.stdout)
    stdout_log_handler.setFormatter(log_formatter)

    for logger in (exception_logger, hwr_logger, user_logger,
                   mx3_hwr_logger, queue_logger):
        logger.addHandler(custom_log_handler)
        logger.addHandler(stdout_log_handler)

        if log_file:
            logger.addHandler(log_file_handler)


def init_state_storage():
    """
    Set up of server side state storage, the UI state of the client is
    stored on the server
    """
    from . import state_storage
    state_storage.init()


def save_settings():
    """
    Saves all application wide variables to disk, stored-mxcube-session.json
    """

    from mxcube3.core import qutils
    queue = qutils.queue_to_dict(blcontrol.queue.get_model_root())

    # For the moment not storing USERS

    data = {"QUEUE": queue,
            "CURRENTLY_MOUNTED_SAMPLE": CURRENTLY_MOUNTED_SAMPLE,
            "SAMPLE_TO_BE_MOUNTED": SAMPLE_TO_BE_MOUNTED,
            "CENTRING_METHOD": CENTRING_METHOD,
            "NODE_ID_TO_LIMS_ID": NODE_ID_TO_LIMS_ID,
            "INITIAL_FILE_LIST": INITIAL_FILE_LIST,
            "SC_CONTENTS": SC_CONTENTS,
            "SAMPLE_LIST": SAMPLE_LIST,
            "TEMP_DISABLED": TEMP_DISABLED,
            "ALLOW_REMOTE": ALLOW_REMOTE,
            "TIMEOUT_GIVES_CONTROL": TIMEOUT_GIVES_CONTROL,
            "VIDEO_DEVICE": VIDEO_DEVICE,
            "AUTO_MOUNT_SAMPLE": AUTO_MOUNT_SAMPLE,
            "AUTO_ADD_DIFFPLAN": AUTO_ADD_DIFFPLAN,
            "NUM_SNAPSHOTS": NUM_SNAPSHOTS,
            "UI_STATE": UI_STATE}

    with open("stored-mxcube-session.json", "w") as fp:
        json.dump(data, fp)


def load_settings():
    """
    Loads application wide variables from "stored-mxcube-session.json"
    """

    global CURRENTLY_MOUNTED_SAMPLE, SAMPLE_TO_BE_MOUNTED, CENTRING_METHOD
    global NODE_ID_TO_LIMS_ID, SC_CONTENTS, SAMPLE_LIST
    global TEMP_DISABLED, USERS, ALLOW_REMOTE, TIMEOUT_GIVES_CONTROL
    global VIDEO_DEVICE, AUTO_MOUNT_SAMPLE, AUTO_ADD_DIFFPLAN, NUM_SNAPSHOTS
    global UI_STATE

    with open("stored-mxcube-session.json", "r") as f:
        data = json.load(f)

    from mxcube3.core import qutils
    qutils.load_queue_from_dict(data.get("QUEUE", {}))

    CENTRING_METHOD = data.get(
        "CENTRING_METHOD", queue_entry.CENTRING_METHOD.LOOP)
    NODE_ID_TO_LIMS_ID = data.get("NODE_ID_TO_LIMS_ID", {})
    SC_CONTENTS = data.get("SC_CONTENTS",
                           {"FROM_CODE": {}, "FROM_LOCATION": {}})
    SAMPLE_LIST = data.get("SAMPLE_LIST",
                           {"sampleList": {}, 'sampleOrder': []})
    ALLOW_REMOTE = data.get("ALLOW_REMOTE", False)
    TIMEOUT_GIVES_CONTROL = data.get("TIMEOUT_GIVES_CONTROL", False)
    AUTO_MOUNT_SAMPLE = data.get("AUTO_MOUNT_SAMPLE", False)
    AUTO_ADD_DIFFPLAN = data.get("AUTO_ADD_DIFFPLAN", False)
    NUM_SNAPSHOTS = data.get("NUM_SNAPSHOTS", False)
    UI_STATE = data.get("UI_STATE", {})


def app_atexit():
    pass
