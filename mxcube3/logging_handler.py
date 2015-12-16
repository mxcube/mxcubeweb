import logging
import traceback
import gevent

class MX3LoggingHandler(logging.Handler):
    def __init__(self):
        logging.Handler.__init__(self)

        self._subscriptions = list()

    def subscribe(self, q):
        self._subscriptions.append(q)

    def unsubscribe(self, q):
        self._subscriptions.remove(q)

    def emit(self, record):
        for sub in self._subscriptions[:]:
           if record.exc_info:
               stack_trace = "".join(traceback.format_exception(*record.exc_info))
           else:
               stack_trace = ""
           gevent.spawn(sub.put, { "message": record.getMessage(), "severity": record.levelname, "timestamp":record.asctime, "logger":record.name, "stack_trace":stack_trace })

