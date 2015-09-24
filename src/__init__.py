from flask import Flask, session, redirect, url_for, render_template, request, Response
from flask.ext.socketio import SocketIO
socketio = SocketIO()
from threading import Thread
import os, sys

app = Flask(__name__, static_url_path='')
app.debug = True

###Importing all the rest-routes
import routes.routesMain, routes.routesBeamline, routes.routesCollection, routes.routesMockups, routes.routesSample, routes.routesSampleCentring

###Initialization of the HardwareObjects
from HardwareRepository import HardwareRepository

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'HardwareObjects/'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'HardwareRepository/HardwareObjects/'))

hwr_directory = os.path.join(os.path.dirname(__file__), 'HardwareObjects.xml/')
hwr = HardwareRepository.HardwareRepository(os.path.abspath(hwr_directory))
hwr.connect()

app.resolution = hwr.getHardwareObject("/resolution-mockup")
#app.diffractometer = hwr.getHardwareObject("/minidiff")
#app.beamline = hwr.getHardwareObject("/beamline-setup")
#app.queue = hwr.getHardwareObject("/queue-model")


