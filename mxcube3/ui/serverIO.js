import io from 'socket.io-client';
import { addLogRecord } from './actions/logger';
import {
  updatePointsPosition,
  saveMotorPositions,
  saveMotorPosition,
  updateMotorState,
  setCurrentPhase,
  setBeamInfo,
  startClickCentring,
} from './actions/sampleview';
import { setBeamlineAttrAction,
         setMachInfo } from './actions/beamline';
import { setActionState } from './actions/beamlineActions';
import { setStatus,
         addTaskResultAction,
         addTaskAction,
         sendStopQueue,
         setCurrentSample } from './actions/queue';
import { collapseItem,
         showResumeQueueDialog } from './actions/queueGUI';
import { setLoading,
         addUserMessage,
         showConnectionLostDialog } from './actions/general';

import { showWorkflowParametersDialog } from './actions/workflow';

import { setObservers, setMaster, requestControlAction } from './actions/remoteAccess';


class ServerIO {

  constructor() {
    this.hwrSocket = null;
    this.loggingSocket = null;
    this.uiStateSocket = null;
    this.hwrsid = null;
    this.connected = false;

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
    this.hwrSocket.emit('setRaMaster', { master: true, name: null }, cb);
  }

  setRemoteAccessObserver(observer, name, cb) {
    this.hwrSocket.emit('setRaMaster', { master: false, name }, cb);
  }

  listen(store) {
    this.dispatch = store.dispatch;

    this.hwrSocket = io.connect(`http://${document.domain}:${location.port}/hwr`);
    this.loggingSocket = io.connect(`http://${document.domain}:${location.port}/logging`);

    this.loggingSocket.on('log_record', (record) => {
      this.dispatch(addLogRecord(record));

      if (record.logger === 'user_level_log') {
        this.dispatch(addUserMessage(record, 'queue'));
      } else {
        this.dispatch(addUserMessage(record));
      }
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

    this.hwrSocket.on('motor_state', (record) => {
      this.dispatch(updatePointsPosition(record.centredPositions));
      this.dispatch(updateMotorState(record.name, record.state));
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

      // The current node might not be a task, in that case ignore it
      if (store.getState().queueGUI.displayData[record.queueID] && record.taskIndex !== null) {
        const taskCollapsed = store.getState().queueGUI.displayData[record.queueID].collapsed;

        if (record.state === 1 && !taskCollapsed) {
          this.dispatch(collapseItem(record.queueID));
        } else if (record.state >= 2 && taskCollapsed) {
          this.dispatch(collapseItem(record.queueID));
        }

        this.dispatch(addTaskResultAction(record.sample, record.taskIndex, record.state,
                                          record.progress, record.limsResultData, record.queueID));
      }
    });

    this.hwrSocket.on('add_task', (record, callback) => {
      if (callback) {
        callback();
      }

      this.dispatch(addTaskAction(record.tasks));
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
                               `Loading sample ${record.location}`,
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

    this.hwrSocket.on('disconnect', () => {
      if (this.connected) {
        this.connected = false;
        setTimeout(() => { this.dispatch(showConnectionLostDialog(!this.connected)); }, 2000);
      }
    });

    this.hwrSocket.on('connect', () => {
      this.connected = true;
      this.dispatch(showConnectionLostDialog(false));
    });

    this.hwrSocket.on('resumeQueueDialog', () => {
      this.dispatch(showResumeQueueDialog(true));
    });

    this.hwrSocket.on('observersChanged', (data) => {
      this.dispatch(setObservers(data));
    });

    this.hwrSocket.on('workflowParametersDialog', (data) => {
      this.dispatch(showWorkflowParametersDialog(data));
    });

    this.hwrSocket.on('setMaster', (data) => {
      const ra = store.getState().remoteAccess;

      if (ra.sid === data.sid && !ra.master) {
        // Given control
        this.dispatch(setMaster(true));
        this.dispatch(setLoading(true, 'You were given control', data.message));
      } else if (ra.sid === data.sid && ra.master) {
        // Keep control
        this.dispatch(setMaster(true));
      } else if (!ra.master) {
        // Control was denied
        if (ra.requestingControl) {
          this.dispatch(setLoading(true, 'You were denied control', data.message));
          this.dispatch(requestControlAction(false));
        }
      } else if (ra.master) {
        // Lost control
        this.dispatch(setMaster(false));
      }
    });

    this.hwrSocket.on('take_xtal_snapshot', (unused, cb) => {
      cb(window.takeSnapshot());
    });

    this.hwrSocket.on('beamline_action', (data) => {
      this.dispatch(setActionState(data.name, data.state));
    });
  }
}

export const serverIO = new ServerIO();
