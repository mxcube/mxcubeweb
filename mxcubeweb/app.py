"""
Module that contains application wide settings and state as well as functions
for accessing and manipulating those.
"""

import os
import sys
import logging
import traceback
import json
import time

from pathlib import Path
from logging import StreamHandler
from logging.handlers import TimedRotatingFileHandler

from mxcubecore import HardwareRepository as HWR
from mxcubecore import removeLoggingHandlers, ColorFormatter
from mxcubecore import queue_entry
from mxcubecore.utils.conversion import make_table

from mxcubeweb.logging_handler import MX3LoggingHandler
from mxcubeweb.core.util.adapterutils import (
    get_adapter_cls_from_hardware_object,
)
from mxcubeweb.core.adapter.adapter_base import AdapterBase
from mxcubeweb.core.components.component_base import import_component
from mxcubeweb.core.components.lims import Lims
from mxcubeweb.core.components.chat import Chat
from mxcubeweb.core.components.samplechanger import SampleChanger
from mxcubeweb.core.components.beamline import Beamline
from mxcubeweb.core.components.sampleview import SampleView
from mxcubeweb.core.components.queue import Queue
from mxcubeweb.core.components.workflow import Workflow
from mxcubeweb.core.models.configmodels import UIComponentModel
from mxcubeweb.core.components.harvester import Harvester


removeLoggingHandlers()


class MXCUBECore:
    # The HardwareRepository object
    hwr = None

    # Below, all the HardwareObjects made available through this module,
    # Initialized by the init function

    # XMLRPCServer
    actions = None
    # Plotting
    plotting = None

    adapter_dict = {}

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
    def init(app):
        """
        Initializes the HardwareRepository with XML files read from hwdir.

        The hwr module must be imported at the very beginning of the application
        start-up to function correctly.

        This method can however be called later, so that initialization can be
        done when one wishes.

        :param app: FIXME ???

        :return: None
        """
        from mxcubeweb.core.adapter.beamline_adapter import (
            BeamlineAdapter,
        )

        fname = os.path.dirname(__file__)
        HWR.add_hardware_objects_dirs([os.path.join(fname, "HardwareObjects")])
        # rhfogh 20210916. The change allows (me) simpler configuration handling
        # and because of changes in init_hardware_repository does not change
        # current functionality.
        _hwr = HWR.get_hardware_repository()

        MXCUBECore.hwr = _hwr

        try:
            MXCUBECore.beamline = BeamlineAdapter(HWR.beamline, MXCUBEApplication)
            MXCUBECore.adapt_hardware_objects(app)
        except Exception:
            msg = "Could not initialize one or several hardware objects, "
            msg += "stopped at first error ! \n"
            msg += "Make sure That all devices servers are running \n"
            msg += "Make sure that the detector software is running \n"
            MXCUBECore.exit_with_error(msg)

    @staticmethod
    def _get_object_from_id(_id):
        if _id in MXCUBECore.adapter_dict:
            return MXCUBECore.adapter_dict[_id]["adapter"]

    @staticmethod
    def _get_adapter_id(ho):
        _id = HWR.beamline.get_id(ho)

        return _id.replace(" ", "_").lower()

    @staticmethod
    def _add_adapter(_id, adapter_cls, ho, adapter_instance):
        if _id not in MXCUBECore.adapter_dict:
            MXCUBECore.adapter_dict[_id] = {
                "id": str(_id),
                "adapter_cls": adapter_cls.__name__,
                "ho": ho.name()[1:],
                "adapter": adapter_instance,
            }
        else:
            logging.getLogger("MX3.HWR").warning(
                f"Skipping {ho.name()}, id: {_id} already exists"
            )

    @staticmethod
    def get_adapter(_id):
        return MXCUBECore._get_object_from_id(_id)

    @staticmethod
    def adapt_hardware_objects(app):
        hwobject_list = [item for item in MXCUBECore.hwr.hardware_objects]

        for ho_name in hwobject_list:
            # Go through all hardware objects exposed by mxcubecore
            # hardware repository set id to username if its defined
            # use the name otherwise (file name without extension)
            ho = MXCUBECore.hwr.get_hardware_object(ho_name)

            if not ho:
                continue

            _id = HWR.beamline.get_id(ho)

            # Try to use the interface exposed by abstract classes in mxcubecore to adapt
            # the object
            adapter_cls = get_adapter_cls_from_hardware_object(ho)

            if adapter_cls:
                try:
                    adapter_instance = adapter_cls(ho, _id, app)
                    logging.getLogger("MX3.HWR").info("Added adapter for %s" % _id)
                except Exception:
                    logging.getLogger("MX3.HWR").exception(
                        "Could not add adapter for %s" % _id
                    )
                    logging.getLogger("MX3.HWR").info("%s not available" % _id)
                    adapter_cls = AdapterBase
                    adapter_instance = AdapterBase(None, _id, app)

                MXCUBECore._add_adapter(_id, adapter_cls, ho, adapter_instance)
            else:
                logging.getLogger("MX3.HWR").info("No adapter for %s" % _id)

        print(
            make_table(
                ["Beamline attribute (id)", "Adapter", "HO filename"],
                [
                    [item["id"], item["adapter_cls"], item["ho"]]
                    for item in MXCUBECore.adapter_dict.values()
                ],
            )
        )


class MXCUBEApplication:
    t0 = time.time()
    # Below variables used for internal application state

    # SampleID and sample data of currently mounted sample, to handle samples
    # that are not mounted by sample changer.
    CURRENTLY_MOUNTED_SAMPLE = ""

    # Sample location of sample that are in process of being mounted
    SAMPLE_TO_BE_MOUNTED = ""

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
    SAMPLE_LIST = {"sampleList": {}, "sampleOrder": []}

    # Users currently logged in
    USERS = {}

    # Path to video device (i.e. /dev/videoX)
    VIDEO_FORMAT = "MPEG1"

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

    # Remember collection paramters between samples
    # or reset (defualt) between samples.
    REMEMBER_PARAMETERS_BETWEEN_SAMPLES = False

    CONFIG = None

    mxcubecore = MXCUBECore()

    server = None

    def __init__(self):
        raise NotImplementedError(
            "MXCUBEApplication is to be used as a pure static class, dont instanciate"
        )

    @staticmethod
    def init(
        server,
        allow_remote,
        ra_timeout,
        log_fpath,
        log_level,
        enabled_logger_list,
        cfg,
    ):
        """
        Initializes application wide variables, sample video stream, and applies

        :param hwr: HardwareRepository module
        :param bool allow_remote: Allow remote usage, True else False
        :param bool ra_timeout: Timeout gives control, True else False

        :return None:
        """
        logging.getLogger("MX3.HWR").info("Starting MXCuBE-Web...")
        MXCUBEApplication.server = server
        MXCUBEApplication.ALLOW_REMOTE = allow_remote
        MXCUBEApplication.TIMEOUT_GIVES_CONTROL = ra_timeout
        MXCUBEApplication.CONFIG = cfg

        MXCUBEApplication.mxcubecore.init(MXCUBEApplication)

        if cfg.app.USE_EXTERNAL_STREAMER:
            MXCUBEApplication.init_sample_video(
                _format=cfg.app.VIDEO_FORMAT,
                port=cfg.app.VIDEO_STREAM_PORT,
            )

        MXCUBEApplication.init_logging(log_fpath, log_level, enabled_logger_list)

        _UserManagerCls = import_component(
            cfg.app.usermanager, package="components.user"
        )

        MXCUBEApplication.queue = Queue(MXCUBEApplication, {})
        MXCUBEApplication.lims = Lims(MXCUBEApplication, {})
        MXCUBEApplication.usermanager = _UserManagerCls(
            MXCUBEApplication, cfg.app.usermanager
        )
        MXCUBEApplication.chat = Chat(MXCUBEApplication, {})
        MXCUBEApplication.sample_changer = SampleChanger(MXCUBEApplication, {})
        MXCUBEApplication.beamline = Beamline(MXCUBEApplication, {})
        MXCUBEApplication.sample_view = SampleView(MXCUBEApplication, {})
        MXCUBEApplication.workflow = Workflow(MXCUBEApplication, {})
        MXCUBEApplication.harvester = Harvester(MXCUBEApplication, {})

        MXCUBEApplication.init_signal_handlers()
        # Install server-side UI state storage
        MXCUBEApplication.init_state_storage()

        msg = "MXCuBE 3 initialized, it took %.1f seconds" % (
            time.time() - MXCUBEApplication.t0
        )
        logging.getLogger("MX3.HWR").info(msg)

    @staticmethod
    def init_sample_video(_format, port):
        """
        Initializes video streaming
        :return: None
        """
        try:
            HWR.beamline.sample_view.camera.start_streaming(_format=_format, port=port)
        except Exception as ex:
            msg = "Could not initialize video, error was: "
            msg += str(ex)
            logging.getLogger("HWR").info(msg)

    @staticmethod
    def init_signal_handlers():
        """
        Connects the signal handlers defined in routes/signals.py to the
        corresponding signals/events
        """
        try:
            MXCUBEApplication.queue.init_signals(HWR.beamline.queue_model)
        except Exception:
            sys.excepthook(*sys.exc_info())

        try:
            MXCUBEApplication.sample_view.init_signals()
        except Exception:
            sys.excepthook(*sys.exc_info())

        try:
            MXCUBEApplication.sample_changer.init_signals()
        except Exception:
            sys.excepthook(*sys.exc_info())

        try:
            MXCUBEApplication.beamline.init_signals()
            MXCUBEApplication.beamline.diffractometer_init_signals()
        except Exception:
            sys.excepthook(*sys.exc_info())

        try:
            MXCUBEApplication.harvester.init_signals()
        except Exception:
            sys.excepthook(*sys.exc_info())

    @staticmethod
    def init_logging(log_file, log_level, enabled_logger_list):
        """
        :param str log_file: Path to log file

        :return: None
        """
        removeLoggingHandlers()

        fmt = "%(asctime)s |%(name)-7s|%(levelname)-7s| %(message)s"
        console_formatter = ColorFormatter(fmt)
        file_formatter = logging.Formatter(fmt)

        if log_file:
            if not os.path.isfile(log_file):
                fpt = open(log_file, "w")
                fpt.write(" ")
                fpt.close()
            os.chmod(log_file, 0o666)
            Path(log_file).touch()

            log_file_handler = TimedRotatingFileHandler(
                log_file, when="midnight", backupCount=7
            )
            log_file_handler.setFormatter(file_formatter)

            uilog_file = f"{log_file[:-4]}_ui.log"
            if not os.path.isfile(uilog_file):
                fpt = open(uilog_file, "w")
                fpt.write(" ")
                fpt.close()
            os.chmod(uilog_file, 0o666)
            Path(uilog_file).touch()

            uilog_file_handler = TimedRotatingFileHandler(
                uilog_file, when="midnight", backupCount=7
            )
            uilog_file_handler.setFormatter(file_formatter)

        if not log_level:
            log_level = "INFO"
        else:
            log_level = log_level.upper()

        custom_log_handler = MX3LoggingHandler(MXCUBEApplication.server)
        custom_log_handler.setLevel(log_level)
        custom_log_handler.setFormatter(file_formatter)

        _loggers = {
            "hwr_logger": logging.getLogger("HWR"),
            "mx3_hwr_logger": logging.getLogger("MX3.HWR"),
            "user_logger": logging.getLogger("user_level_log"),
            "queue_logger": logging.getLogger("queue_exec"),
            "mx3_ui_logger": logging.getLogger("MX3.UI"),
        }

        stdout_log_handler = StreamHandler(sys.stdout)
        stdout_log_handler.setFormatter(console_formatter)

        for logger_name, logger in _loggers.items():
            if logger_name in enabled_logger_list:
                logger.addHandler(custom_log_handler)
                logger.addHandler(stdout_log_handler)
                logger.setLevel(log_level)

                if log_file and "mx3_ui" in logger_name:
                    logger.addHandler(uilog_file_handler)
                elif log_file:
                    logger.addHandler(log_file_handler)

                logger.propagate = False
            else:
                logger.disabled = True

    @staticmethod
    def init_state_storage():
        """
        Set up of server side state storage, the UI state of the client is
        stored on the server
        """
        from mxcubeweb import state_storage

        state_storage.init()

    @staticmethod
    def get_ui_properties():
        # Add type information to each component retrieved from the beamline adapter
        # (either via config or via mxcubecore.beamline)

        for _id, section in MXCUBEApplication.CONFIG.app.ui_properties:
            if section:
                for component in section.components:
                    # Check that the component, if it's a UIComponentModel, corresponds
                    # to a HardwareObjects that is available and that it can be
                    # adapted.
                    if isinstance(component, UIComponentModel):
                        try:
                            mxcore = MXCUBEApplication.mxcubecore
                            adapter = mxcore.get_adapter(component.attribute)
                            adapter_cls_name = type(adapter).__name__
                            value_type = adapter.adapter_type
                        except AttributeError:
                            msg = (
                                f"{component.attribute} not accessible via Beamline"
                                " object. "
                            )
                            msg += (
                                f"Verify that beamline.{component.attribute} is valid"
                                " and/or "
                            )
                            msg += f"{component.attribute} accessible via get_role "
                            msg += "check ui.yaml configuration file. "
                            msg += "(attribute will NOT be available in UI)"
                            logging.getLogger("HWR").warning(msg)
                            adapter_cls_name = ""
                            value_type = ""
                        else:
                            adapter_cls_name = adapter_cls_name.replace("Adapter", "")

                        if not component.object_type:
                            component.object_type = adapter_cls_name

                        if not component.value_type:
                            component.value_type = value_type

        return {
            key: value.dict()
            for (
                key,
                value,
            ) in MXCUBEApplication.CONFIG.app.ui_properties
            if value
        }

    @staticmethod
    def save_settings():
        """
        Saves all application wide variables to disk, stored-mxcube-session.json
        """
        queue = MXCUBEApplication.queue.queue_to_dict(
            HWR.beamline.queue_model.get_model_root()
        )

        # For the moment not storing USERS

        data = {
            "QUEUE": queue,
            "CURRENTLY_MOUNTED_SAMPLE": MXCUBEApplication.CURRENTLY_MOUNTED_SAMPLE,
            "SAMPLE_TO_BE_MOUNTED": MXCUBEApplication.SAMPLE_TO_BE_MOUNTED,
            "CENTRING_METHOD": MXCUBEApplication.CENTRING_METHOD,
            "NODE_ID_TO_LIMS_ID": MXCUBEApplication.NODE_ID_TO_LIMS_ID,
            "INITIAL_FILE_LIST": MXCUBEApplication.INITIAL_FILE_LIST,
            "SC_CONTENTS": MXCUBEApplication.SC_CONTENTS,
            "SAMPLE_LIST": MXCUBEApplication.SAMPLE_LIST,
            "TEMP_DISABLED": MXCUBEApplication.TEMP_DISABLED,
            "ALLOW_REMOTE": MXCUBEApplication.ALLOW_REMOTE,
            "TIMEOUT_GIVES_CONTROL": MXCUBEApplication.TIMEOUT_GIVES_CONTROL,
            "VIDEO_FORMAT": MXCUBEApplication.VIDEO_FORMAT,
            "AUTO_MOUNT_SAMPLE": MXCUBEApplication.AUTO_MOUNT_SAMPLE,
            "AUTO_ADD_DIFFPLAN": MXCUBEApplication.AUTO_ADD_DIFFPLAN,
            "NUM_SNAPSHOTS": MXCUBEApplication.NUM_SNAPSHOTS,
            "UI_STATE": MXCUBEApplication.UI_STATE,
        }

        fname = Path("/tmp/stored-mxcube-session.json")
        fname.touch(exist_ok=True)

        with open(fname, "w+") as fp:
            json.dump(data, fp)
