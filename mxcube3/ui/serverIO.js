import io from 'socket.io-client';
import { addLogRecord } from './actions/logger';
import {
  setShapes,
  saveMotorPosition,
  updateMotorState,
  setBeamInfo,
  startClickCentring,
  updateShapes,
  setPixelsPerMm,
  videoMessageOverlay,
  setCurrentPhase
} from './actions/sampleview';
import { setBeamlineAttrAction,
         setMachInfo } from './actions/beamline';
import { setActionState,
         newPlot,
         plotData,
         plotEnd } from './actions/beamlineActions';
import { setStatus,
         addTaskResultAction,
         updateTaskLimsData,
         addTaskAction,
         sendStopQueue,
         setCurrentSample,
         addDiffractionPlanAction,
         setSampleAttribute,
         setRootPath } from './actions/queue';
import { collapseItem,
         showResumeQueueDialog } from './actions/queueGUI';
import { setLoading,
         addUserMessage,
         showConnectionLostDialog } from './actions/general';

import { showWorkflowParametersDialog } from './actions/workflow';

import { setObservers, setMaster, requestControlAction,
         incChatMessageCount } from './actions/remoteAccess';
import { doSignOut } from './actions/login';

import { addResponseMessage } from 'react-chat-widget';

import { setSCState,
         setLoadedSample,
         setSCGlobalState,
         updateSCContents } from './actions/sampleChanger';

import { setEnergyScanResult } from './actions/taskResults';

import { CLICK_CENTRING } from './constants';

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
    this.uiStateSocket = io.connect(`//${document.domain}:${location.port}/ui_state`);

    this.uiStateSocket.on('state_update', (newState) => {
      statePersistor.rehydrate(JSON.parse(newState));
    });
  }

  setRemoteAccessMaster(name, cb) {
    this.hwrSocket.emit('setRaMaster', { master: true, name }, cb);
  }

  setRemoteAccessObserver(name, cb) {
    this.hwrSocket.emit('setRaObserver', { master: true, name }, cb);
  }

  listen(store) {
    this.dispatch = store.dispatch;

    this.hwrSocket = io.connect(`//${document.domain}:${location.port}/hwr`);
    this.loggingSocket = io.connect(`//${document.domain}:${location.port}/logging`);

    this.loggingSocket.on('log_record', (record) => {
      this.dispatch(addLogRecord(record));

      if (record.logger === 'user_level_log') {
        this.dispatch(addUserMessage(record, 'queue'));
      } else {
        this.dispatch(addUserMessage(record));
      }
    });

    this.hwrSocket.on('ra_chat_message', (record) => {
      const sid = store.getState().remoteAccess.sid;
      if (record.sid !== sid) {
        addResponseMessage(`${record.date} **${record.user}:** \n\n ${record.message}`);
        this.dispatch(incChatMessageCount());
      }
    });

    this.hwrSocket.on('motor_position', (record) => {
      this.dispatch(saveMotorPosition(record.name, record.position));
    });

    this.hwrSocket.on('motor_state', (record) => {
      this.dispatch(updateMotorState(record.name, record.state));
    });

    this.hwrSocket.on('update_shapes', (record) => {
      this.dispatch(setShapes(record.shapes));
    });

    this.hwrSocket.on('update_pixels_per_mm', (record) => {
      this.dispatch(setPixelsPerMm(record.pixelsPerMm));
    });

    this.hwrSocket.on('beam_changed', (record) => {
      this.dispatch(setBeamInfo(record.data));
    });

    this.hwrSocket.on('mach_info_changed', (info) => {
      this.dispatch(setMachInfo(info));
    });

    this.hwrSocket.on('beamline_value_change', (data) => {
      this.dispatch(setBeamlineAttrAction(data));
    });

    this.hwrSocket.on('grid_result_available', (data) => {
      this.dispatch(updateShapes([data.shape]));
    });

    this.hwrSocket.on('energy_scan_result', (data) => {
      this.dispatch(setEnergyScanResult(data.pk, data.ip, data.rm));
    });

    this.hwrSocket.on('update_task_lims_data', (record) => {
      this.dispatch(updateTaskLimsData(record.sample, record.taskIndex, record.limsResultData));
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

    this.hwrSocket.on('add_diff_plan', (record, callback) => {
      if (callback) {
        callback();
      }
      this.dispatch(addDiffractionPlanAction(record.tasks));
    });

    this.hwrSocket.on('queue', (record, callback) => {
      if (callback) {
        callback();
      }

      if (record.Signal === 'DisableSample') {
        this.dispatch(setSampleAttribute(record.sampleID, 'checked', false));
      } else {
        this.dispatch(setStatus(record.Signal));
      }
    });

    this.hwrSocket.on('sc', (record) => {
      if (record.signal === 'operatingSampleChanger') {
        this.dispatch(setLoading(true, 'Sample changer in operation',
                                 record.message, true, () => (this.dispatch(sendStopQueue()))));
      } else if ((record.signal === 'loadingSample' || record.signal === 'loadedSample')) {
        this.dispatch(setLoading(true, `Loading sample ${record.location}`,
                                 record.message, true, () => (this.dispatch(sendStopQueue()))));
      } else if (record.signal === 'unLoadingSample' || record.signal === 'unLoadedSample') {
        this.dispatch(setLoading(true, `Unloading sample ${record.location}`,
                                 record.message, true, () => (this.dispatch(sendStopQueue()))));
      } else if (record.signal === 'loadReady') {
        this.dispatch(setLoading(false, 'SC Ready',
                                 record.message, true, () => (this.dispatch(sendStopQueue()))));
      } else if (record.signal === 'inSafeArea') {
        this.dispatch(setLoading(false, 'SC Safe',
                                 record.message, true, () => (this.dispatch(sendStopQueue()))));
      }
    });

    this.hwrSocket.on('sample_centring', (data) => {
      if (data.method === CLICK_CENTRING) {
        this.dispatch(startClickCentring());
        const msg = '3-Click Centring: <br /> Select centered position or center';
        this.dispatch(videoMessageOverlay(true, msg));
      } else {
        const msg = 'Auto loop centring: <br /> Save position or re-center';
        this.dispatch(videoMessageOverlay(true, msg));
      }
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

    this.hwrSocket.on('observerLogout', (observer) => {
      addResponseMessage(`**${observer.name}** (${observer.host}) disconnected.`);
    });

    this.hwrSocket.on('observerLogin', (observer) => {
      if (observer.name && observer.host) {
        addResponseMessage(`**${observer.name}** (${observer.host}) connected.`);
      } else {
        addResponseMessage(`${observer.host} connecting ...`);
      }
    });

    this.hwrSocket.on('forceSignoutObservers', () => {
      const ra = store.getState().remoteAccess;

      if (!ra.master) {
        this.dispatch(doSignOut());
      }
    });

    this.hwrSocket.on('workflowParametersDialog', (data) => {
      this.dispatch(showWorkflowParametersDialog(data));
    });

    this.hwrSocket.on('setMaster', (data) => {
      const state = store.getState();
      const ra = state.remoteAccess;

      // Given control
      if (!ra.master) {
        this.dispatch(setLoading(true, 'You were given control', data.message));
      }

      this.dispatch(setRootPath(data.rootPath));
      this.dispatch(setMaster(true, data.name));
    });

    this.hwrSocket.on('setObserver', (data) => {
      const state = store.getState();
      const ra = state.remoteAccess;

      // Control was denied by master or control was taken by force
      if (ra.requestingControl) {
        this.dispatch(setLoading(true, 'You were denied control', data.message));
        this.dispatch(requestControlAction(false));
      }

      this.dispatch(setRootPath(data.rootPath));
      this.dispatch(setMaster(false, data.name));
    });

    this.hwrSocket.on('take_xtal_snapshot', (unused, cb) => {
      cb(window.takeSnapshot());
    });

    this.hwrSocket.on('beamline_action', (data) => {
      this.dispatch(setActionState(data.name, data.state, data.data));
    });

    this.hwrSocket.on('sc_state', (state) => {
      this.dispatch(setSCState(state));
    });

    this.hwrSocket.on('loaded_sample_changed', (data) => {
      this.dispatch(setLoadedSample(data));
    });

    this.hwrSocket.on('set_current_sample', (sample) => {
      this.dispatch(setCurrentSample(sample.sampleID));
    });

    this.hwrSocket.on('sc_maintenance_update', (data) => {
      this.dispatch(setSCGlobalState(data));
    });

    this.hwrSocket.on('sc_contents_update', () => {
      this.dispatch(updateSCContents());
    });

    this.hwrSocket.on('diff_phase_changed', (data) => {
      this.dispatch(setCurrentPhase(data.phase));
    });

    this.hwrSocket.on('new_plot', (plotInfo) => {
      this.dispatch(newPlot(plotInfo));
    });

    this.hwrSocket.on('plot_data', (data) => {
      this.dispatch(plotData(data.id, data.data, false));
    });

    this.hwrSocket.on('plot_end', (data) => {
      this.dispatch(plotData(data.id, data.data, true));
      this.dispatch(plotEnd(data));
    });
  }
}

export const serverIO = new ServerIO();
