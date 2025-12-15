"""Application-wide settings and state.

Module that contains application-wide settings and state
as well as functions for accessing and manipulating them.
"""

import logging
import sys
import time
from logging import StreamHandler
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

try:
    import graypy
except ImportError:
    graypy = None

from mxcubecore import (
    ColorFormatter,
)
from mxcubecore import HardwareRepository as HWR
from mxcubecore import (
    removeLoggingHandlers,
)

from mxcubeweb.core.adapter.adapter_manager import HardwareObjectAdapterManager
from mxcubeweb.core.components.chat import Chat
from mxcubeweb.core.components.component_base import import_component
from mxcubeweb.core.components.harvester import Harvester
from mxcubeweb.core.components.queue import Queue
from mxcubeweb.core.components.workflow import Workflow
from mxcubeweb.core.components.lims import Lims
from mxcubeweb.core.components.log import Log
from mxcubeweb.core.models.configmodels import UIComponentModel
from mxcubeweb.logging_handler import MX3LoggingHandler
from mxcubeweb.core.server.resource_handler import ResourceHandlerFactory

removeLoggingHandlers()


class MXCUBEApplication:
    t0 = time.time()
    # Below variables used for internal application state

    # SampleID and sample data of currently mounted sample, to handle samples
    # that are not mounted by sample changer.
    CURRENTLY_MOUNTED_SAMPLE = ""

    # Sample location of sample that are in process of being mounted
    SAMPLE_TO_BE_MOUNTED = ""

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
    UI_STATE = {}
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
    DEFAULT_NUM_SNAPSHOTS = 4

    # Remember collection paramters between samples
    # or reset (defualt) between samples.
    REMEMBER_PARAMETERS_BETWEEN_SAMPLES = False

    CONFIG = None

    mxcubecore = None

    server = None

    def __init__(self):
        msg = "MXCUBEApplication is to be used as a pure static class, dont instanciate"
        raise NotImplementedError(msg)

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
        """Initializes application wide variables, sample video stream, and applies.

        Params:
            allow_remote(bool): Allow remote usage, ``True`` else ``False``.
            ra_timeout(bool): Timeout gives control, ``True`` else ``False``.
        """
        # The routes created by the AdapterResourceHandler
        # via the factory are kept between calls to init as they
        # are stored in class variable and only initialized once
        #
        # This is only in paractice an issue fo the tests that
        # re-initializes the application for each test, we thus
        # need to remove all AdapterResourceHandlers from the
        # factory.
        ResourceHandlerFactory.unregister_all()

        logging.getLogger("MX3.HWR").info("Starting MXCuBE-Web...")
        MXCUBEApplication.server = server
        MXCUBEApplication.ALLOW_REMOTE = allow_remote
        MXCUBEApplication.TIMEOUT_GIVES_CONTROL = ra_timeout
        MXCUBEApplication.CONFIG = cfg
        MXCUBEApplication.mxcubecore = HardwareObjectAdapterManager(MXCUBEApplication)

        MXCUBEApplication.mxcubecore.init()

        if cfg.app.MXCUBE_STARTS_VIDEO_STREAM:
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
        MXCUBEApplication.workflow = Workflow(MXCUBEApplication, {})
        MXCUBEApplication.harvester = Harvester(MXCUBEApplication, {})
        MXCUBEApplication.log = Log(MXCUBEApplication, {})

        MXCUBEApplication.init_signal_handlers()
        # Install server-side UI state storage
        MXCUBEApplication.init_state_storage()

        msg = "MXCuBE initialized, it took %.1f seconds" % (
            time.time() - MXCUBEApplication.t0
        )
        logging.getLogger("MX3.HWR").info(msg)

    @staticmethod
    def init_sample_video(_format, port) -> None:
        """Initialize video streaming."""
        try:
            HWR.beamline.sample_view.camera.start_streaming(_format=_format, port=port)
        except Exception as ex:
            msg = "Could not initialize video, error was: "
            msg += str(ex)
            logging.getLogger("HWR").info(msg)

    @staticmethod
    def init_signal_handlers():
        """Connect the signal handlers.

        Connect the signal handlers defined in ``routes/signals.py``
        to the corresponding signals/events.
        """
        MXCUBEApplication.queue.init_signals(HWR.beamline.queue_model)
        MXCUBEApplication.harvester.init_signals()

    @staticmethod
    def _get_graylog_handler(config, log_level):
        if graypy is None:
            return None
        server_cfg = getattr(config, "server", None)
        graylog_host = getattr(server_cfg, "GRAYLOG_HOST", None)
        graylog_port = getattr(server_cfg, "GRAYLOG_PORT", None)
        if graylog_host and graylog_port:
            try:
                handler = graypy.GELFUDPHandler(graylog_host, graylog_port)
            except Exception as ex:
                msg = "Graylog handler could not be initialized: " + str(ex)
                logging.getLogger("HWR").info(msg)
            else:
                handler.setLevel(log_level)
                return handler
        return None

    @staticmethod
    def init_logging(log_file: str, log_level, enabled_logger_list) -> None:
        """Initializes and configures logging.

        Sets up logging behavior including log file output, logging level,
        and which loggers are enabled. This function should be called once
        during application startup to ensure consistent logging across
        all modules.

        `uilog_file_handler`, `access_file_handler` and `csp_file_handler` are logged
        to separate files with the suffixes: `_ui.log`, `_server_access.log` and
        `_server_csp.log` if `log_file` is provided.

        Args:
            log_file (str): Path to the log file where log messages will be written.
                            The path may be absolute or relative.
            log_level: Logging severity level that determines which messages are
                       recorded. Typically a constant from the standard `logging`
                       module (e.g., `logging.INFO`, `logging.DEBUG`).
            enabled_logger_list: Iterable of logger names to enable and configure.
                                 Only the specified loggers will be active.

        Returns:
            None
        """
        removeLoggingHandlers()

        fmt = "%(asctime)s |%(name)-7s|%(levelname)-7s| %(message)s"
        file_fmt = logging.Formatter(fmt)
        console_fmt = ColorFormatter(fmt)
        log_level = (log_level or "INFO").upper()

        if log_file:
            file_handlers = {
                "log_file_handler": {
                    "handler": None,
                    "path": log_file,
                },
                "uilog_file_handler": {
                    "handler": None,
                    "path": str(
                        Path(log_file).with_name(f"{Path(log_file).stem}_ui.log")
                    ),
                },
                "access_file_handler": {
                    "handler": None,
                    "path": str(
                        Path(log_file).with_name(
                            f"{Path(log_file).stem}_server_access.log"
                        )
                    ),
                },
                "csp_file_handler": {
                    "handler": None,
                    "path": str(
                        Path(log_file).with_name(
                            f"{Path(log_file).stem}_server_csp.log"
                        )
                    ),
                },
            }

            for item in file_handlers.values():
                Path(item["path"]).touch(exist_ok=True)
                handler = TimedRotatingFileHandler(
                    item["path"], when="midnight", backupCount=7
                )
                handler.setFormatter(file_fmt)
                item["handler"] = handler

        custom_handler = MX3LoggingHandler(MXCUBEApplication.server)
        custom_handler.setLevel(log_level)
        custom_handler.setFormatter(file_fmt)

        gelf_handler = MXCUBEApplication._get_graylog_handler(
            MXCUBEApplication.CONFIG, log_level
        )

        stdout_handler = StreamHandler(sys.stdout)
        stdout_handler.setFormatter(console_fmt)

        logger_map = {
            "hwr_logger": "HWR",
            "server_logger": "MX3.HWR",
            "user_logger": "user_level_log",
            "queue_logger": "queue_exec",
            "ui_logger": "MX3.UI",
            "csp_logger": "csp",
            "server_access_logger": "server_access",
        }

        for attr, name in logger_map.items():
            logger = logging.getLogger(name)

            if attr in enabled_logger_list:
                logger.setLevel(log_level)

                if gelf_handler:
                    logger.addHandler(gelf_handler)

                if log_file:
                    if attr == "server_access_logger":
                        logger.addHandler(
                            file_handlers["access_file_handler"]["handler"]
                        )
                    elif attr == "mx3_ui_logger":
                        logger.addHandler(
                            file_handlers["uilog_file_handler"]["handler"]
                        )
                    elif attr == "csp_logger":
                        logger.addHandler(file_handlers["csp_file_handler"]["handler"])
                    else:
                        logger.addHandler(file_handlers["log_file_handler"]["handler"])
                        logger.addHandler(custom_handler)
                        logger.addHandler(stdout_handler)
                else:
                    logger.addHandler(custom_handler)
                    logger.addHandler(stdout_handler)

                logger.propagate = False
                setattr(MXCUBEApplication, attr, logger)
            else:
                logger.disabled = True

    @staticmethod
    def init_state_storage():
        """Set up of server side state storage.

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
            if section and hasattr(section, "components"):
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
