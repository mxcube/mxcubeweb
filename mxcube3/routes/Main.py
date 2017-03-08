from mxcube3 import app as mxcube
import logging

@mxcube.route('/', defaults={'path': ''})
@mxcube.route('/<path:path>')
def serve_static_file(path):
    logging.getLogger('HWR').info('[Main] Serving main page')
    return mxcube.send_static_file('index.html')
