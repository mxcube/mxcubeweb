import json
import logging

from mxcubeweb import logging_handler
from mxcubeweb.core.components.component_base import ComponentBase
from mxcubeweb.core.models.configmodels import (
    ResourceHandlerConfigModel,
)

hwr_logger = logging.getLogger("MX3.HWR")


class Log(ComponentBase):
    def __init__(self, app, config):
        super().__init__(
            app,
            config,
            resource_handler_config=ResourceHandlerConfigModel(
                exports=[
                    {
                        "attr": "log",
                        "method": "GET",
                        "url": "/",
                        "decorators": [app.server.restrict],
                    },
                    {
                        "attr": "log_frontend_traceback",
                        "method": "POST",
                        "url": "/log_frontend_traceback",
                        "decorators": [app.server.restrict],
                    },
                ]
            ),
        )

    def log(self):
        """
        Retrieve log messages
        """
        messages = []

        for handler in logging.getLogger("MX3.HWR").handlers:
            if isinstance(handler, logging_handler.MX3LoggingHandler):
                messages = handler.buffer

        return messages

    def log_frontend_traceback(self, args):
        """
        Logs a UI traceback to the UI logger
        """
        logging.getLogger("MX3.UI").error("------ Start of UI trace back ------")
        logging.getLogger("MX3.UI").error("Traceback: %s", args["stack"])
        logging.getLogger("MX3.UI").error(
            "State: %s", json.dumps(args["state"], indent=4)
        )
        logging.getLogger("MX3.UI").error("------ End of UI trace back ------")
        return {}
