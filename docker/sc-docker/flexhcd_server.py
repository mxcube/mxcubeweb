#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
EMBLFlexHCD Sample Changer Simulator Server
Implements the Exporter protocol to simulate a FlexHCD sample changer
"""

import socket
import threading
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("FlexHCD-Server")


class FlexHCDSimulator:
    """Simulator for EMBLFlexHCD sample changer"""
    
    def __init__(self):
        self.state = "READY"
        self.status = "Sample Changer Ready"
        self.mounted_sample = (-1, -1, -1)  # (cell, basket, sample)
        self.gripper_type = 1  # UNIPUCK
        self.supported_grippers = [1, 2, 4]  # UNIPUCK, MINISPINE, UNIPUCK_DOUBLE
        
        # Present samples: "cell,puck,type,barcode,well,sample_barcode,state"
        self.present_samples = [
            "1,1,UNI,PUCK001,1,SAMPLE001,0",
            "1,1,UNI,PUCK001,2,SAMPLE002,0",
            "1,1,UNI,PUCK001,3,SAMPLE003,0",
            "1,2,UNI,PUCK002,1,SAMPLE011,0",
            "1,2,UNI,PUCK002,2,SAMPLE012,0",
            "2,1,UNI,PUCK003,1,SAMPLE021,0",
        ]
        
        self.last_exception = None
        self.power_enabled = False
        
    def get_state(self):
        return self.state
    
    def get_status(self):
        return self.status
    
    def get_mounted_sample_position(self):
        return self.mounted_sample
    
    def get_present_samples(self):
        return ":".join(self.present_samples)
    
    def get_gripper_type(self):
        return self.gripper_type
    
    def get_supported_grippers(self):
        return self.supported_grippers
    
    def get_last_task_exception(self):
        return self.last_exception or ""
    
    def load_sample(self, cell, basket, sample):
        logger.info(f"Loading sample: cell={cell}, basket={basket}, sample={sample}")
        self.state = "RUNNING"
        time.sleep(1)
        self.mounted_sample = (int(cell), int(basket), int(sample))
        self.state = "READY"
        self.last_exception = None
        return True
    
    def unload_sample(self, cell, basket, sample):
        logger.info(f"Unloading sample: cell={cell}, basket={basket}, sample={sample}")
        self.state = "RUNNING"
        time.sleep(1)
        self.mounted_sample = (-1, -1, -1)
        self.state = "READY"
        self.last_exception = None
        return True


class ExporterProtocolHandler:
    """Handles the Exporter protocol communication"""
    
    PARAM_SEP = "\t"
    ARRAY_SEP = "\x1f"
    
    def __init__(self, simulator):
        self.simulator = simulator
        self.commands = {
            "loadSample": self._cmd_load_sample,
            "unloadSample": self._cmd_unload_sample,
        }
        
        self.attributes = {
            "State": lambda: self.simulator.get_state(),
            "getState": lambda: self.simulator.get_state(),
            "getStatus": lambda: self.simulator.get_status(),
            "Status": lambda: self.simulator.get_status(),
            "getMountedSamplePosition": lambda: self.simulator.get_mounted_sample_position(),
            "MountedSamplePosition": lambda: self.simulator.get_mounted_sample_position(),
            "getPresentSamples": lambda: self.simulator.get_present_samples(),
            "PresentSamples": lambda: self.simulator.get_present_samples(),
            "get_gripper_type": lambda: self.simulator.get_gripper_type(),
            "getSupportedGrippers": lambda: self.simulator.get_supported_grippers(),
            "SupportedGrippers": lambda: self.simulator.get_supported_grippers(),
            "getLastTaskException": lambda: self.simulator.get_last_task_exception(),
            "LastTaskException": lambda: self.simulator.get_last_task_exception(),
        }
    
    def _cmd_load_sample(self, args):
        params = args.split(self.PARAM_SEP) if args else []
        if len(params) >= 3:
            cell, basket, sample = params[0].strip("'\""), params[1].strip("'\""), params[2].strip("'\"")
            result = self.simulator.load_sample(cell, basket, sample)
            return f"RET:{result}"
        return "ERR:Invalid parameters for loadSample"
    
    def _cmd_unload_sample(self, args):
        params = args.split(self.PARAM_SEP) if args else []
        if len(params) >= 3:
            cell, basket, sample = params[0].strip("'\""), params[1].strip("'\""), params[2].strip("'\"")
            result = self.simulator.unload_sample(cell, basket, sample)
            return f"RET:{result}"
        return "ERR:Invalid parameters for unloadSample"
    
    def handle_message(self, message):
        # Remove STX (0x02) and ETX (0x03) control characters used by Exporter protocol
        message = message.strip('\x02\x03 \t\n\r')
        logger.info(f"Received: {message}")
        
        if not message:
            return "ERR:Empty message"
        
        parts = message.split(" ", 1)
        cmd_type = parts[0]
        
        # READ - Read property/attribute
        if cmd_type == "READ":
            if len(parts) < 2:
                return "ERR:Missing attribute name"
            attr_name = parts[1].strip()
            
            if attr_name in self.attributes:
                value = self.attributes[attr_name]()
                
                if isinstance(value, tuple):
                    return f"RET:{self.ARRAY_SEP}{self.ARRAY_SEP.join(map(str, value))}{self.ARRAY_SEP}"
                elif isinstance(value, list):
                    return f"RET:{self.ARRAY_SEP}{self.ARRAY_SEP.join(map(str, value))}{self.ARRAY_SEP}"
                elif value is None:
                    return "NULL"
                else:
                    return f"RET:{value}"
            else:
                return f"ERR:Unknown attribute {attr_name}"
        
        # EXEC - Execute command
        elif cmd_type == "EXEC":
            if len(parts) < 2:
                return "ERR:Missing command name"
            
            cmd_parts = parts[1].split(" ", 1)
            cmd_name = cmd_parts[0]
            cmd_args = cmd_parts[1] if len(cmd_parts) > 1 else ""
            
            if cmd_name in self.commands:
                try:
                    return self.commands[cmd_name](cmd_args)
                except Exception as e:
                    logger.error(f"Error executing {cmd_name}: {e}")
                    return f"ERR:{str(e)}"
            else:
                return f"ERR:Unknown command {cmd_name}"
        
        # LIST - List methods
        elif cmd_type == "LIST":
            methods = self.PARAM_SEP.join(self.commands.keys())
            return f"RET:{methods}{self.PARAM_SEP}"
        
        # PLST - List properties
        elif cmd_type == "PLST":
            props = self.PARAM_SEP.join(self.attributes.keys())
            return f"RET:{props}{self.PARAM_SEP}"
        
        # NAME - Get server name
        elif cmd_type == "NAME":
            return "RET:FlexHCD"
        
        else:
            return f"ERR:Unknown command type {cmd_type}"


class ExporterServer:
    """Exporter protocol TCP server"""
    
    def __init__(self, host='0.0.0.0', port=9001): # nosec B104
        self.host = host
        self.port = port
        self.simulator = FlexHCDSimulator()
        self.handler = ExporterProtocolHandler(self.simulator)
        self.server_socket = None
        self.running = False
        
    def handle_client(self, client_socket, client_address):
        logger.info(f"New connection from {client_address}")
        
        try:
            while self.running:
                data = client_socket.recv(4096)
                if not data:
                    break
                
                message = data.decode('utf-8')
                response = self.handler.handle_message(message)
                
                # Add STX/ETX control characters for Exporter protocol
                response_with_control = f"\x02{response}\x03"
                logger.info(f"Sending: {response}")
                client_socket.sendall(response_with_control.encode('utf-8'))
                
        except Exception as e:
            logger.error(f"Error handling client {client_address}: {e}", exc_info=True)
        finally:
            client_socket.close()
            logger.info(f"Connection closed from {client_address}")
    
    def start(self):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        self.running = True
        
        logger.info(f"FlexHCD Exporter Server started on {self.host}:{self.port}")
        
        try:
            while self.running:
                client_socket, client_address = self.server_socket.accept()
                client_thread = threading.Thread(
                    target=self.handle_client,
                    args=(client_socket, client_address),
                    daemon=True
                )
                client_thread.start()
        except KeyboardInterrupt:
            logger.info("Server interrupted")
        finally:
            self.stop()
    
    def stop(self):
        self.running = False
        if self.server_socket:
            self.server_socket.close()
        logger.info("Server stopped")


if __name__ == "__main__":
    server = ExporterServer(host='0.0.0.0', port=9001) # nosec B104
    server.start()
