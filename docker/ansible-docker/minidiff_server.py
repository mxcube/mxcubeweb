#!/usr/bin/env python3
"""
MiniDiff/Microdiff Simulator - Minimal Exporter Protocol Implementation
Based on Microdiff.py actual usage
"""

import socket
import threading
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('MiniDiff')

STX, ETX = b'\x02', b'\x03'

class MiniDiffSimulator:
    def __init__(self, host='0.0.0.0', port=9002): #nosec B104
        self.host, self.port = host, port
        self.running = False
        
        # State
        self.state = 'Ready' 
        self.current_phase = 'Centring' 
        self.head_type = 'MiniKappa'  
        
        # Motor positions
        self.motors = {
            'Omega': 0.0,
            'AlignmentX': 0.0,
            'AlignmentY': 0.0,
            'AlignmentZ': 0.0,
            'CentringX': 0.0,
            'CentringY': 0.0,
            'Kappa': 0.0,
            'Phi': 0.0,
            'Zoom': 1.0,
        }
        
        # Motor limits (min, max)
        self.motor_limits = {
            'Omega': [-360.0, 360.0],
            'AlignmentX': [-10.0, 10.0],
            'AlignmentY': [-10.0, 10.0],
            'AlignmentZ': [-10.0, 10.0],
            'CentringX': [-10.0, 10.0],
            'CentringY': [-10.0, 10.0],
            'Kappa': [0.0, 360.0],
            'Phi': [-360.0, 360.0],
            'Zoom': [0.1, 10.0],
            'FrontLight': [0.0, 1.0],
            'BackLight': [0.0, 1.0],
        }
        
        # Motor states
        self.motor_states = {motor: 'Ready' for motor in self.motors}
        
        # Beamstop and capillary positions
        self.beamstop_position = 'OUT'
        self.capillary_position = 'OUT'
        
        self.coax_scale_x = 0.000444 
        self.coax_scale_y = 0.000446  
        
        self.beam_x = 318.0
        self.beam_y = 238.0
        
        self.scan_range = 0.1
        self.scan_exposure = 0.1
        self.scan_start_angle = 0.0
        self.scan_nb_frames = 1
        

        self.frontlight = 0.5
        self.backlight = 0.5
        self.frontlight_is_on = False
        self.backlight_is_on = False
        
    def handle_message(self, msg):
        """Process Exporter READ/EXEC commands"""
        logger.info(f"← {msg}")
        
        if msg.startswith('READ '):
            attr = msg[5:].strip()
            
            if attr == 'State':
                return self.state
            
            elif attr == 'HardwareState':
                return self.state
            
            elif attr == 'CoaxCamScaleX':
                return self.coax_scale_x
            
            elif attr == 'CoaxCamScaleY':
                return self.coax_scale_y
            
            elif attr == 'HeadType':
                return self.head_type
            
            elif attr == 'CurrentPhase':
                return self.current_phase
            
            elif attr == 'KappaIsEnabled':
                return True
            
            elif attr == 'BeamPositionHorizontal':
                return self.beam_x
            
            elif attr == 'BeamPositionVertical':
                return self.beam_y
            
            elif attr == 'ScanRange':
                return self.scan_range
            
            elif attr == 'ScanExposureTime':
                return self.scan_exposure
            
            elif attr == 'ScanStartAngle':
                return self.scan_start_angle
            
            elif attr == 'ScanNumberOfFrames':
                return self.scan_nb_frames
            
            elif attr == 'DetectorGatePulseEnabled':
                return True
            
            elif attr == 'DetectorGatePulseReadoutTime':
                return 0.003 
            
            elif attr == 'FrontLightFactor':
                return self.frontlight
            
            elif attr == 'BackLightFactor':
                return self.backlight
            
            elif attr == 'FrontLightIsOn':
                return self.frontlight_is_on
            
            elif attr == 'BackLightIsOn':
                return self.backlight_is_on
            
            elif attr == 'PhiState':
                return self.motor_states.get('Phi', 'Ready')
            
            elif attr == 'PhiPosition':
                return self.motors.get('Phi', 0.0)
            
            elif attr == 'BeamstopPosition':
                return self.beamstop_position
            
            elif attr == 'CapillaryPosition':
                return self.capillary_position

        elif msg.startswith('WRTE '):
            parts = msg[5:].split('\t', 1)
            if len(parts) == 2:
                attr, value = parts
                
                if attr == 'ScanRange':
                    self.scan_range = float(value)
                    return None
                
                elif attr == 'ScanExposureTime':
                    self.scan_exposure = float(value)
                    return None
                
                elif attr == 'ScanStartAngle':
                    self.scan_start_angle = float(value)
                    return None
                
                elif attr == 'ScanNumberOfFrames':
                    self.scan_nb_frames = int(value)
                    return None
                
                elif attr == 'DetectorGatePulseEnabled':
                    return None 
                
                elif attr == 'DetectorGatePulseReadoutTime':
                    return None 
                
                elif attr == 'FrontLightFactor':
                    self.frontlight = float(value)
                    self.frontlight_is_on = self.frontlight > 0
                    return None
                
                elif attr == 'BackLightFactor':
                    self.backlight = float(value)
                    self.backlight_is_on = self.backlight > 0
                    return None

        elif msg.startswith('EXEC '):
            parts = msg[5:].split('\t')
            cmd = parts[0]
            args = parts[1:] if len(parts) > 1 else []
            
            if cmd == 'abort':
                self.state = 'Ready'
                return None
            
            elif cmd == 'startSetPhase':
                if args:
                    self.current_phase = args[0]
                return None
            
            elif cmd == 'SyncMoveMotors':
                return None
            
            elif cmd == 'startSimultaneousMoveMotors':
                if args:
                    pairs = args[0].split(';')
                    for pair in pairs:
                        if '=' in pair:
                            motor, value = pair.split('=')
                            self.motors[motor] = float(value)
                return None
            
            elif cmd == 'getOmegaMotorDynamicScanLimits':
                if self.head_type == 'Plate':
                    return [170.0, 190.0]
                return [-360.0, 360.0]
            
            elif cmd == 'getMotorLimits':
                motor_name = args[0] if args else None
                if motor_name and motor_name in self.motor_limits:
                    return self.motor_limits[motor_name]
                return 'ERR: Unknown motor'
            
            elif cmd == 'saveCentringPositions':
                return None
            
            elif cmd == 'setRoomTemperatureMode':
                return None
            
            elif cmd.startswith('startScan'):
                self.state = 'Running'
                self.state = 'Ready'
                return None
            
            elif cmd.startswith('startRasterScan'):
                self.state = 'Running'
                self.state = 'Ready'
                return None
            
            elif cmd.startswith('startCharacterisation'):
                self.state = 'Running'
                self.state = 'Ready'
                return None
            
            elif cmd in ['prepareSSXGridScan', 'startSSXGridScan', 'startSSXStillScan',
                         'getSSXScanMethod', 'getSSXDeltaT', 'prepareSSXLineScan',
                         'startSSXLineScan', 'setPlateVertical']:
                return None
        
        return 'ERR: Unknown command'
    
    def process_client(self, sock, addr):
        logger.info(f"Client {addr} connected")
        try:
            while self.running:
                data = sock.recv(4096)
                if not data:
                    break
                
                msg = data.strip(STX + ETX).decode('utf-8')
                response = self.handle_message(msg)
                
                if response is None:
                    reply = b'NULL'
                elif isinstance(response, list):
                    reply = f'RET:{chr(9).join(map(str, response))}'.encode('utf-8')
                else:
                    reply = f'RET:{response}'.encode('utf-8')
                
                logger.info(f"→ {reply}")
                sock.send(STX + reply + ETX)
        
        except Exception as e:
            logger.error(f"Client error: {e}")
        finally:
            sock.close()
            logger.info(f"Client {addr} disconnected")
    
    def start(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((self.host, self.port))
        sock.listen(5)
        sock.settimeout(1.0)
        self.running = True
        
        logger.info(f"MiniDiff Simulator on {self.host}:{self.port}")
        
        try:
            while self.running:
                try:
                    client, addr = sock.accept()
                    threading.Thread(target=self.process_client, args=(client, addr), daemon=True).start()
                except socket.timeout:
                    continue
        except KeyboardInterrupt:
            logger.info("Shutdown")
        finally:
            self.running = False
            sock.close()

if __name__ == '__main__':
    MiniDiffSimulator().start()
