from flask import session, redirect, url_for, render_template, request, Response, jsonify
from mxcube3 import app as mxcube

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


@mxcube.route("/mxcube/api/v0.1/log_stream")
def logging():

    def gen():
        while True:
            data = mxcube.log_handler.get_last_record()
            ev = ServerSentEvent(str(data))
            yield ev.encode()

    return Response(gen(), mimetype="text/event-stream")

            
