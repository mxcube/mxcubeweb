import os
import sys
import logging
import atexit
import json

from logging import StreamHandler, NullHandler
from logging.handlers import TimedRotatingFileHandler

from HardwareRepository import removeLoggingHandlers
from queue_entry import CENTRING_METHOD

from mxcube3 import blcontrol

# SampleID of currently mounted sample
CURRENTLY_MOUNTED_SAMPLE = {}
SAMPLE_TO_BE_MOUNTED = ''
CENTRING_METHOD = CENTRING_METHOD.LOOP
NODE_ID_TO_LIMS_ID = {}
INITIAL_FILE_LIST = []
SC_CONTENTS = {"FROM_CODE": {}, "FROM_LOCATION": {}}
SAMPLE_LIST = {"sampleList": {}, 'sampleOrder': []}
TEMP_DISABLED = []
USERS = {}
ALLOW_REMOTE = False
TIMEOUT_GIVES_CONTROL = False
VIDEO_DEVICE = None
AUTO_MOUNT_SAMPLE = False
AUTO_ADD_DIFFPLAN = False
NUM_SNAPSHOTS = 4
UI_STATE = dict()


def init(allow_remote, ra_timeout, video_device):
    from mxcube3.core import utils

    global ALLOW_REMOTE, TIMEOUT_GIVES_CONTROL
    ALLOW_REMOTE = allow_remote
    TIMEOUT_GIVES_CONTROL = ra_timeout

    init_sample_video(video_device)
    utils.enable_snapshots(blcontrol.collect, blcontrol.diffractometer)
    init_signal_handlers()

    atexit.register(app_atexit)


def init_sample_video(video_device):
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

    import logging_handler
    custom_log_handler = logging_handler.MX3LoggingHandler()
    custom_log_handler.setLevel(logging.DEBUG)
    custom_log_handler.setFormatter(log_formatter)

    exception_logger = logging.getLogger("exceptions")
    hwr_logger = logging.getLogger("HWR")
    user_logger = logging.getLogger("user_level_log")
    queue_logger = logging.getLogger("queue_exec")
    stdout_log_handler = StreamHandler(sys.stdout)
    stdout_log_handler.setFormatter(log_formatter)

    for logger in (exception_logger, hwr_logger, user_logger, queue_logger):
        logger.addHandler(custom_log_handler)
        logger.addHandler(stdout_log_handler)

        if log_file:
            logger.addHandler(log_file_handler)


def init_state_storage():
    import state_storage
    state_storage.init()


def save_settings():
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


def app_atexit():
    save_settings()
