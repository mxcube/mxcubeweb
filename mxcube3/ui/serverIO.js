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
    const socketHWR = io.connect('http://' + document.domain + ':' + location.port + '/hwr');

    const socket = io.connect('http://' + document.domain + ':' + location.port + '/logging');

    const energy = io.connect(`http://${document.domain}:${location.port}/beamline/energy`);

    socket.on('log_record', (record) => {
        this.dispatch(addLogRecord(record));
    });

    socketHWR.on('Motors', (record) => {
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

    energy.on('value_change', (data) => {
      this.dispatch(beamlinePropertyValueAction(data));
    });

    socketHWR.on('Task', (record) => {
        this.dispatch(doAddTaskResult(record.Sample, record.QueueId, record.State));
    });

  }

}

