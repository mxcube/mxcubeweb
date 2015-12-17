import logging
import traceback
import gevent

class MX3LoggingHandler(logging.Handler):
    def __init__(self):
        logging.Handler.__init__(self)

        self._subscriptions = list()

    def _record_to_json(self, record):
        if record.exc_info:
            stack_trace = "".join(traceback.format_exception(*record.exc_info))
        else:
            stack_trace = ""
        try:
            record.asctime
        except AttributeError:
            record.asctime = logging._defaultFormatter.formatTime(record)
        return { "message": record.getMessage(), "severity": record.levelname, "timestamp":record.asctime, "logger":record.name, "stack_trace":stack_trace }

    """ this code works with SSE implementation of logging handler,
    keep it here as an example since it can be useful in some situations

    def subscribe(self, q):
        self._subscriptions.append(q)

    def unsubscribe(self, q):
        self._subscriptions.remove(q)

    def emit(self, record):
        record_dict = self._record_to_json(record)
        for sub in self._subscriptions[:]:
            gevent.spawn(sub.put, record_dict)
    """

    def connect(self, callback):
        self._subscriptions.append(callback)
        
    def emit(self, record):
        record_dict = self._record_to_json(record)
        for sub in self._subscriptions[:]:
            gevent.spawn(sub, record_dict)

    def disconnect(self, callback):
        self._subscriptions.remove(callback)

