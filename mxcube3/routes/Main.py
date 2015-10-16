from flask import session, redirect, url_for, render_template, request, Response
import logging
from .. import app as mxcube

@mxcube.route("/")
def serve_static_file():
	logging.getLogger('HWR').info('[Main] Serving main page')
	return mxcube.send_static_file('SampleView.html')
