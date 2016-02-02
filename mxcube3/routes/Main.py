from mxcube3 import app as mxcube
import logging


@mxcube.route("/")
def serve_static_file():
    logging.getLogger('HWR').info('[Main] Serving main page')
    # return mxcube.send_static_file('Main.html')
    # return mxcube.send_static_file('SampleView.html')
    return mxcube.send_static_file('index.html')
