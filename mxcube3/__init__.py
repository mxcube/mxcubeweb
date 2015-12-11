from __future__ import absolute_import
from flask import Flask, session, redirect, url_for, render_template, request, Response
from flask.ext.socketio import SocketIO
from optparse import OptionParser
import os, sys

# some Hardware Objects rely on BlissFramework.Utils.widget_colors,
# it's ugly but here is some code to solve the problem for the
# time being:
from types import ModuleType
import collections
bf=ModuleType("BlissFramework")
bfu=ModuleType("BlissFramework.Utils")
wc=collections.namedtuple("widget_colors", ["LIGHT_GREEN", "LIGHT_RED", "LIGHT_YELLOW", "LIGHT_BLUE", "SKY_BLUE", "DARK_GRAY","WHITE", "GRAY", "GREEN", "RED"])
setattr(bfu, "widget_colors", wc(*[None]*10))
sys.modules["BlissFramework"]=bf
sys.modules["BlissFramework.Utils"]=bfu
###

opt_parser = OptionParser()
opt_parser.add_option("-r", "--repository",
                      dest="hwr_directory",
                      help="Hardware Repository XML files path",
                      default=os.path.join(os.path.dirname(__file__), 'HardwareObjects.xml/'))
opt_parser.add_option("-l", "--log-file",
                      dest="log_file",
                      help="Hardware Repository log file name",
                      default='')
opt_parser.add_option("-s", "--beamline-setup",
                      dest="beamline_setup",
                      help="Beamline setup HWR file",
                      default='/beamline-setup')
opt_parser.add_option("-q", "--queue-model",
                      dest="queue_model",
                      help="Queue model HWR file",
                      default='/queue-model')
cmdline_options, args = opt_parser.parse_args()

socketio = SocketIO()
app = Flask(__name__, static_url_path='')	
app.debug = True

socketio.init_app(app) # this line important for socketio msg, otherwise no msg is sent...
@socketio.on('connect', namespace='/test')
def connect():
    print 'someone connected'
    socketio.emit('test', {'data': 'Welcome'}, namespace='/test')

# the following test prevents Flask from initializing twice
# (because of the Reloader)
if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
  ###Initialization of the HardwareObjects
  # this is to allow Hardware Objects to do 'from HardwareRepository import ...'
  sys.path.insert(0, os.path.dirname(__file__)) 
  from HardwareRepository import HardwareRepository as hwr, setLogFile
  hwr.addHardwareObjectsDirs([os.path.join(os.path.dirname(__file__), 'HardwareObjects')])

  hwr_directory = cmdline_options.hwr_directory
  hwr = hwr.HardwareRepository(os.path.abspath(os.path.expanduser(hwr_directory)))
  hwr.connect()
  log_file = cmdline_options.log_file
  if log_file:
     setLogFile(log_file)

  app.beamline = hwr.getHardwareObject(cmdline_options.beamline_setup)
  app.session = app.beamline.getObjectByRole("session")
  app.diffractometer = app.beamline.getObjectByRole("diffractometer")
  app.db_connection = app.beamline.getObjectByRole("lims_client")
  app.queue = app.beamline.getObjectByRole("queue-model")
  app.sample_changer = app.beamline.getObjectByRole("sample_changer")

  ###Importing all REST-routes
  import routes.Main, routes.Login, routes.Beamline, routes.Collection, routes.Mockups, routes.SampleCentring, routes.SampleChanger, routes.Queue

