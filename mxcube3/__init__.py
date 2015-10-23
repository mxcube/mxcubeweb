from flask import Flask, session, redirect, url_for, render_template, request, Response
from flask.ext.socketio import SocketIO
from optparse import OptionParser
import os, sys

socketio = SocketIO()
app = Flask(__name__, static_url_path='')	
app.debug = True
socketio.init_app(app) # this line important for socketio msg, otherwise no msg is sent...
@socketio.on('connect', namespace='/test')
def connect():
    print 'someone connected'
    socketio.emit('test', {'data': 'Welcome'}, namespace='/test')

opt_parser = OptionParser()
opt_parser.add_option("-r", "--repository", 
                      dest="hwr_directory", 
                      help="Hardware Repository XML files path", 
                      default=os.path.join(os.path.dirname(__file__), 'HardwareObjects.xml/'))
cmdline_options, args = opt_parser.parse_args()

###Initialization of the HardwareObjects
from .HardwareRepository import HardwareRepository 
HardwareRepository.addHardwareObjectsDirs([os.path.join(os.path.dirname(__file__), 'HardwareObjects')])
# this is to allow Hardware Objects to do 'from HardwareRepository import ...'
sys.path.insert(0, os.path.dirname(__file__))

hwr_directory = cmdline_options.hwr_directory
hwr_directory = './mxcube3/HardwareObjects.xml/'
hwr = HardwareRepository.HardwareRepository(os.path.abspath(os.path.expanduser(hwr_directory)))
hwr.connect()

app.resolution = hwr.getHardwareObject("/resolution-mockup")
app.diffractometer = hwr.getHardwareObject("/md2-9113")
#app.diffractometer = hwr.getHardwareObject("/minidiff")
#app.beamline = hwr.getHardwareObject("/beamline-setup")
#app.queue = hwr.getHardwareObject("/queue-model")

###Importing all REST-routes
import routes.Main, routes.Beamline, routes.Collection, routes.Mockups, routes.Sample, routes.SampleCentring