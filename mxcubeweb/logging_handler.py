import logging


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
            "message": record.getMessage(),
            "severity": record.levelname,
            "timestamp": record.asctime,
        }

    def emit(self, record):
        if record.name == "user_level_log":
            record_dict = self._record_to_json(record)
            super().emit(record_dict)
            self.server.emit("log_record", record_dict, namespace="/logging")
