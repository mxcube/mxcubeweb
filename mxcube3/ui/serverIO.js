import io from 'socket.io-client';
import { addLogRecord } from './actions/logger';
import {
  updatePointsPosition,
  saveMotorPositions,
  setCurrentPhase,
  setBeamPosition
} from './actions/sampleview';
import { setBeamlineAttrAction } from './actions/beamline';
import { addTaskResultAction, addTaskAction } from './actions/SamplesGrid';
import { setStatus } from './actions/queue';


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
        default:
      }
    });

    this.hwrSocket.on('beam_changed', (data) => {
      this.dispatch(setBeamPosition(data));
    });

    this.hwrSocket.on('beamline_value_change', (data) => {
      this.dispatch(setBeamlineAttrAction(data));
    });

    this.hwrSocket.on('Task', (record) => {
      this.dispatch(addTaskResultAction(record.Sample, record.QueueId, record.State));
    });

    this.hwrSocket.on('add_task', (record) => {
      const { queueID, sampleID, taskinfo, parameters } = record;
      this.dispatch(addTaskAction(queueID, sampleID, taskinfo, parameters));
    });

    this.hwrSocket.on('Queue', (record) => {
      this.dispatch(setStatus(record.Signal));
    });
  }
}
