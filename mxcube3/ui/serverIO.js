import io from 'socket.io-client';
import { addLogRecord } from './actions/logger';
import {
  updatePointsPosition,
  saveMotorPositions,
  saveMotorPosition,
  setCurrentPhase,
  setBeamInfo,
  startClickCentring,
} from './actions/sampleview';
import { setBeamlineAttrAction, setMachInfo } from './actions/beamline';
import { setStatus,
         addTaskResultAction,
         addTaskAction,
         collapseTask,
         sendStopQueue,
         setCurrentSample } from './actions/queue';
import { setLoading } from './actions/general';

class ServerIO {

  constructor() {
    this.hwrSocket = null;
    this.loggingSocket = null;
    this.uiStateSocket = null;

    this.uiStorage = {
      setItem: (key, value) => {
        this.uiStateSocket.emit('ui_state_set', [key, value]);
      },
      getItem: (key, cb) => {
        this.uiStateSocket.emit('ui_state_get', key, (value) => { cb(false, value); });
      },
      removeItem: (key) => {
        this.uiStateSocket.emit('ui_state_rm', key);
      },
      getAllKeys: (cb) => {
        this.uiStateSocket.emit('ui_state_getkeys', null, (value) => { cb(false, value); });
      }
    };
  }

  connectStateSocket(statePersistor) {
    this.uiStateSocket = io.connect(`http://${document.domain}:${location.port}/ui_state`);

    this.uiStateSocket.on('state_update', (newState) => {
      statePersistor.rehydrate(JSON.parse(newState));
    });
  }

  setRemoteAccessMaster(cb) {
    this.hwrSocket.emit('setRaMaster', cb);
  }

  listen(store) {
    this.dispatch = store.dispatch;

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

    this.hwrSocket.on('motor_position', (record) => {
      this.dispatch(saveMotorPosition(record.name, record.position));
    });

    this.hwrSocket.on('beam_changed', (record) => {
      this.dispatch(setBeamInfo(record.Data));
    });

    this.hwrSocket.on('mach_info_changed', (info) => {
      this.dispatch(setMachInfo(info));
    });

    this.hwrSocket.on('beamline_value_change', (data) => {
      this.dispatch(setBeamlineAttrAction(data));
    });

    this.hwrSocket.on('task', (record, callback) => {
      if (callback) {
        callback();
      }

      const sampleDisplayData = store.getState().queue.displayData[record.sample];
      const taskCollapsed = sampleDisplayData.tasks[record.taskIndex].collapsed;

      if (record.state === 1 && !taskCollapsed) {
        this.dispatch(collapseTask(record.sample, record.taskIndex));
      } else if (record.state === 2 && taskCollapsed) {
        this.dispatch(collapseTask(record.sample, record.taskIndex));
      }
      this.dispatch(addTaskResultAction(record.sample, record.taskIndex, record.state,
                                        record.progress, record.limsResultData));
    });

    this.hwrSocket.on('add_task', (record, callback) => {
      if (callback) {
        callback();
      }

      this.dispatch(addTaskAction(record));
    });

    this.hwrSocket.on('queue', (record, callback) => {
      if (callback) {
        callback();
      }

      this.dispatch(setStatus(record.Signal));
    });

    this.hwrSocket.on('sc', (record) => {
      this.dispatch(setLoading((record.signal === 'loadingSample' ||
                                record.signal === 'loadedSample'),
                               'Loading sample',
                               record.message, true, () => (this.dispatch(sendStopQueue()))));

      if (record.signal === 'loadReady') {
        this.dispatch(setCurrentSample(record.location));
      }
    });

    this.hwrSocket.on('sample_centring', (record) => {
      this.dispatch(setLoading(record.signal === 'SampleCentringRequest',
                              'Center sample',
                               record.message, false));
      this.dispatch(startClickCentring());
    });
  }
}

export const serverIO = new ServerIO();

