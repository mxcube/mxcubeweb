import logging
from flask import jsonify, make_response

from mxcube3 import server
from mxcube3 import logging_handler

@server.route("/mxcube/api/v0.1/log", methods=["GET"])
@server.restrict
def log():
    """
    Retrive log messages
    """
    messages = []

    for handler in logging.getLogger("MX3.HWR").handlers:
        if isinstance(handler, logging_handler.MX3LoggingHandler):
            messages = handler.buffer
    
    return jsonify(messages)
