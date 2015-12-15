import logging
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
           gevent.spawn(sub.put, { "message": self.format(record), "level": record.levelname })

