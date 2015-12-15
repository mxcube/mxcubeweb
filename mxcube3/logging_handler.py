import logging
from gevent.event import Event

class MX3LoggingHandler(logging.Handler):
    def __init__(self, queue):
        logging.Handler.__init__(self)

        self._last = dict()
        self._new_log_record = Event()

    def emit(self, record):
        self._last.update({"type":"log", "data": { "message": self.format(record), "level": record.levelname }})
        new_log_record.set()
        new_log_record.clear() 

    def get_last_record(self):
        self._new_log_record.wait()
        return self._last
