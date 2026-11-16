import logging
import uuid

LOGGER_NAMES_MAP = {
    "csp_logger": "csp",
    "exception_logger": "ex_logger",
    "hwr_logger": "HWR",
    "queue_logger": "queue_exec",
    "server_access_logger": "server_access",
    "server_logger": "MX3.HWR",
    "ui_logger": "MX3.UI",
    "user_logger": "user_level_log",
}
LOGGER_NAMES = list(LOGGER_NAMES_MAP.keys())


class MX3LoggingHandler(logging.handlers.BufferingHandler):
    def __init__(self, server):
        super().__init__(1000)
        self.server = server

        @server.flask_socketio.on("connect", namespace="/logging")
        @server.ws_restrict
        def connect():
            pass

    def _record_to_json(self, record):
        try:
            record.asctime
        except AttributeError:
            record.asctime = logging._defaultFormatter.formatTime(record)

        return {
            "id": str(uuid.uuid4()),
            "message": record.getMessage(),
            "severity": record.levelname,
            "timestamp": record.asctime,
        }

    def emit(self, record):
        if record.name == "user_level_log":
            record_dict = self._record_to_json(record)
            super().emit(record_dict)
            self.server.emit("log_record", record_dict, namespace="/logging")
