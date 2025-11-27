#!/usr/bin/env python3
"""
FlexHCD Sample Changer Simulator - Minimal Exporter Protocol Implementation
Based on EMBLFlexHCD.py actual usage
"""

import socket
import threading
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('FlexHCD')

STX, ETX = b'\x02', b'\x03'

class SampleChangerSimulator:
    def __init__(self, host='0.0.0.0', port=9001): #nosec B104
        self.host, self.port = host, port
        self.running = False
        self.mounted = (-1, -1, -1)  
        self.state = 'Ready'
        
    def handle_message(self, msg):
        """Process Exporter READ/EXEC commands based on EMBLFlexHCD.py"""
        logger.info(f"← {msg}")
        
        if msg.startswith('READ '):
            attr = msg[5:].strip()
            
            if attr == 'State':
                return self.state  
            
            elif attr == 'Status':
                if self.mounted == (-1, -1, -1):
                    return 'No sample mounted'
                return f'Sample {self.mounted[0]}:{self.mounted[1]}:{self.mounted[2]:02d} mounted'
            
            elif attr == 'MountedSamplePosition':
                return str(self.mounted)
            
            elif attr == 'PresentSamples':
                return ''
            
            elif attr == 'LastTaskException':
                return None 
            
            elif attr == 'RobotIsSafe':
                return True 
            
            elif attr == 'get_gripper_type':
                return 1  
            
            elif attr == 'SupportedGrippers':
                return str([1, 2]) 
        
        elif msg.startswith('EXEC '):
            parts = msg[5:].split('\t')
            cmd = parts[0]
            args = parts[1:] if len(parts) > 1 else []
            
            if cmd == 'loadSample':
                if len(args) >= 3:
                    self.state = 'Running'
                    self.mounted = (int(args[0]), int(args[1]), int(args[2]))
                    self.state = 'Ready'
                    return None
            
            elif cmd == 'unloadSample':
                self.state = 'Running'
                self.mounted = (-1, -1, -1)
                self.state = 'Ready'
                return None
            
            elif cmd == 'moveDewar':
                return None
            
            elif cmd == 'resetLoadedPosition':
                self.mounted = (-1, -1, -1)
                return None
            
            elif cmd in ['homeClear', 'abort', 'defreezeGripper', 'changeGripper', 
                         'setGripper', 'trashMountedSample']:
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
        
        logger.info(f"SampleChanger Simulator on {self.host}:{self.port}")
        
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
    SampleChangerSimulator().start()
