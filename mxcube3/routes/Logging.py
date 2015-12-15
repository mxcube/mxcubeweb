from flask import session, redirect, url_for, render_template, request, Response, jsonify
from mxcube3 import app as mxcube
from gevent.queue import Queue
import json

# SSE protocol is described here: http://mzl.la/UPFyxY
class ServerSentEvent(object):

    def __init__(self, data):
        self.data = data
        self.desc_map = {
            self.data : "data",
        }

    def encode(self):
        if not self.data:
            return ""
        lines = ["%s: %s" % (v, k) 
                 for k, v in self.desc_map.iteritems() if k]
       
        return "%s\n\n" % "\n".join(lines)


@mxcube.route("/mxcube/api/v0.1/logging_stream")
def logging():

    def gen():
        q = Queue()
        mxcube.log_handler.subscribe(q)
        try:
            while True:
                ev = ServerSentEvent(json.dumps(q.get()))
                yield ev.encode()
        except GeneratorExit:
            mxcube.log_handler.unsubscribe(q)

    return Response(gen(), mimetype="text/event-stream")

            
