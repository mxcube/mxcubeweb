import io from 'socket.io-client';
import { addLogRecord } from './actions/logger';
import { updatePointsPosition, saveMotorPositions, setCurrentPhase } from './actions/sampleview';
import { beamlinePropertyValueAction } from './actions/beamline';
import { doAddTaskResult } from './actions/samples_grid';


export default class ServerIO {

  constructor(dispatch) {
      this.dispatch = dispatch;
  }

  listen() {
    this.hwrSocket = io.connect(`http://${document.domain}:${location.port}/hwr`);

    this.loggingSocket = io.connect(`http://${document.domain}:${location.port}/logging`);

    this.loggingSocket.on('log_record', (record) => {
        this.dispatch(addLogRecord(record));
    });

    this.hwrSocket.on('Motors', (record) => {
      this.dispatch(updatePointsPosition(record.CentredPositions));
      this.dispatch(saveMotorPositions(record.Motors));
      switch (record.Signal) {
        case 'minidiffPhaseChanged':
          this.dispatch(setCurrentPhase(record.Data));
          break;
        case 'n':
          console.log('sada');
          break;
      }  
    });
    
    this.hwrSocket.on('beamline_value_change', (data) => {
        this.dispatch(beamlinePropertyValueAction(data));
    });
    
    this.hwrSocket.on('Task', (record) => {
        this.dispatch(doAddTaskResult(record.CentredPositions));
    });

    this.hwrSocket.on('Queue', (record) => {
      this.dispatch(setStatus(record.Signal));
    });

  }				
}

