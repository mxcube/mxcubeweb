import logging, json
from flask.ext.socketio import emit
from .. import socketio
MaxLabMicrodiff_signals = ['minidiffReady','minidiffNotReady','phizMotorStateChanged','phiyMotorStateChanged','zoomMotorPredefinedPositionChanged','zoomMotorStateChanged','sampxMotorStateChanged','sampyMotorStateChanged','centringInvalid','newAutomaticCentringPoint','centringStarted','centringAccepted','centringMoving','centringFailed','centringSuccessful','progressMessage','centringSnapshots'] #'phiMotorStateChanged','minidiffStateChanged', 'diffractometerMoved', removed to cleanup the log

BL9113MultiCollect_signals = ['collectConnected', 'collectReady',  'collectNumberOfFrames', 'collectImageTaken','collectReady','collectStarted','collectOscillationStarted', 'collectOscillationFailed', 'collectOscillationFinished','collectEnded']

def signalCallback4(*args, **kwargs):
    logging.getLogger("HWR").debug(kwargs) 
    logging.getLogger("HWR").debug(args) 
    sender = str(kwargs['sender'].__class__).split('.')[0]
    signal = kwargs['signal']
    if len(args) >0:
        if args[0] in MaxLabMicrodiff_signals:
            msg = {'data':'no data', 'signal': args[0],'sender':sender}
        else:
            msg = {'data':json.dumps(args), 'signal': signal,'sender':sender}
    else:
        msg = {'data':'A signal', 'signal': signal,'sender':sender}
    
    logging.getLogger("HWR").debug('Signal callback. origin: "%s",signal: "%s"' %(sender,signal))
    try:
        socketio.emit('newSignal',msg , namespace='/test')
    except:
        logging.getLogger("HWR").error('error creating the message')

# def signalCallback(aSignal, aSender, *args):
#     try:
#         logging.getLogger("HWR").debug('Signal callback. origin: "%s",signal: "%s"' %(aSender,aSignal))
#         msg = {'data':'A signal', 'signal': aSignal,'sender':str(aSender.__class__).split('.')[0]}
#         socketio.emit('newSignal',msg , namespace='/test')
#     except:
#         logging.getLogger("HWR").error('error creating the message')