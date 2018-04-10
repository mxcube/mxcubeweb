from mxcube3 import app as mxcube
import logging

@mxcube.route('/samplegrid')
@mxcube.route('/datacollection')
@mxcube.route('/samplechanger')
@mxcube.route('/logging')
@mxcube.route('/remoteaccess')
@mxcube.restrict
def serve_static_file():
    logging.getLogger('HWR').info('[Main] Serving main page')
    return mxcube.send_static_file('index.html')

@mxcube.route('/')
@mxcube.route('/login')
def unrestricted_serve_static_file():
    logging.getLogger('HWR').info('[Main] Serving main page')
    return mxcube.send_static_file('index.html')
