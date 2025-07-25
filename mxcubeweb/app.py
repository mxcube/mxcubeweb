"""
Module that contains application wide settings and state as well as functions
for accessing and manipulating those.
"""

import logging
import os
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
from mxcubeweb.core.components.beamline import Beamline
from mxcubeweb.core.components.chat import Chat
from mxcubeweb.core.components.component_base import import_component
from mxcubeweb.core.components.harvester import Harvester
from mxcubeweb.core.components.lims import Lims
from mxcubeweb.core.components.queue import Queue
from mxcubeweb.core.components.samplechanger import SampleChanger
from mxcubeweb.core.components.sampleview import SampleView
from mxcubeweb.core.components.workflow import Workflow
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
        """
        Initializes application wide variables, sample video stream, and applies

        :param hwr: HardwareRepository module
        :param bool allow_remote: Allow remote usage, True else False
        :param bool ra_timeout: Timeout gives control, True else False

        :return None:
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
        MXCUBEApplication.log = Log(MXCUBEApplication, {})

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
        MXCUBEApplication.queue.init_signals(HWR.beamline.queue_model)
        MXCUBEApplication.sample_view.init_signals()
        MXCUBEApplication.sample_changer.init_signals()
        MXCUBEApplication.beamline.init_signals()
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
            Path(uilog_file).touch()

            uilog_file_handler = TimedRotatingFileHandler(
                uilog_file, when="midnight", backupCount=7
            )
            uilog_file_handler.setFormatter(file_formatter)

        log_level = "INFO" if not log_level else log_level.upper()

        custom_log_handler = MX3LoggingHandler(MXCUBEApplication.server)
        custom_log_handler.setLevel(log_level)
        custom_log_handler.setFormatter(file_formatter)
        gelf_handler = MXCUBEApplication._get_graylog_handler(
            MXCUBEApplication.CONFIG, log_level
        )

        _loggers = {
            "hwr_logger": logging.getLogger("HWR"),
            "mx3_hwr_logger": logging.getLogger("MX3.HWR"),
            "user_logger": logging.getLogger("user_level_log"),
            "queue_logger": logging.getLogger("queue_exec"),
            "mx3_ui_logger": logging.getLogger("MX3.UI"),
            "csp_logger": logging.getLogger("csp"),
        }

        stdout_log_handler = StreamHandler(sys.stdout)
        stdout_log_handler.setFormatter(console_formatter)

        for logger_name, logger in _loggers.items():
            if logger_name in enabled_logger_list:
                logger.addHandler(custom_log_handler)
                logger.addHandler(stdout_log_handler)
                if gelf_handler:
                    logger.addHandler(gelf_handler)
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
