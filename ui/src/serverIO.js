/* eslint-disable promise/prefer-await-to-callbacks */
import io from 'socket.io-client';
import { addResponseMessage } from 'react-chat-widget';
import { addLogRecord } from './actions/logger';
import {
  setShapes,
  saveMotorPosition,
  updateMotorState,
  setBeamInfo,
  startClickCentringAction,
  updateShapesAction,
  setPixelsPerMm,
  videoMessageOverlay,
  setCurrentPhase,
} from './actions/sampleview';
import {
  updateBeamlineHardwareObjectAction,
  updateBeamlineHardwareObjectValueAction,
  updateBeamlineHardwareObjectAttributeAction,
} from './actions/beamline';
import {
  setActionState,
  addUserMessage,
  newPlot,
  plotData,
  plotEnd,
} from './actions/beamlineActions';
import {
  setStatus,
  addTaskResultAction,
  updateTaskLimsData,
  addTaskAction,
  stopQueue,
  setCurrentSample,
  addDiffractionPlanAction,
  setSampleAttribute,
  getQueue,
} from './actions/queue';
import { collapseItem, showResumeQueueDialog } from './actions/queueGUI';
import { showConnectionLostDialog } from './actions/general';

import {
  showWorkflowParametersDialog,
  showGphlWorkflowParametersDialog,
  updateGphlWorkflowParametersDialog,
} from './actions/workflow';

import { getRaState, incChatMessageCount } from './actions/remoteAccess';

import { signOut, getLoginInfo } from './actions/login';

import {
  setSCState,
  setLoadedSample,
  setSCGlobalState,
  updateSCContents,
} from './actions/sampleChanger';

import {
  setHarvesterState,
  updateHarvesterContents,
} from './actions/harvester';

import { setEnergyScanResult } from './actions/taskResults';

import { CLICK_CENTRING } from './constants';
import { store } from './store';
import { hideWaitDialog, showWaitDialog } from './actions/waitDialog';

const { dispatch } = store;

class ServerIO {
  constructor() {
    this.hwrSocket = null;
    this.loggingSocket = null;
  }

  listen() {
    this.disconnect(); // noop if `disconnect` is properly called on logout

    this.connectHwr();
    this.connectLogging();
  }

  disconnect() {
    this.hwrSocket?.close();
    this.hwrSocket = null;

    this.loggingSocket?.close();
    this.loggingSocket = null;
  }

  connectHwr() {
    this.hwrSocket = io.connect(`/hwr`);

    this.hwrSocket.on('connect', () => {
      console.log('hwrSocket connected!'); // eslint-disable-line no-console
      dispatch(showConnectionLostDialog(false));
    });

    this.hwrSocket.on('connect_error', (error) => {
      console.error('hwrSocket connection error:', error.message); // eslint-disable-line no-console
    });

    this.hwrSocket.on('disconnect', (reason) => {
      console.log('hwrSocket disconnected!'); // eslint-disable-line no-console
      const socket = this.hwrSocket;

      if (reason === 'io server disconnect') {
        setTimeout(() => {
          socket.connect(); // try reconnecting
        }, 500);
      }

      setTimeout(() => {
        dispatch(showConnectionLostDialog(!socket.connected));
      }, 2000);
    });

    this.hwrSocket.on('ra_chat_message', (record) => {
      const { username } = store.getState().login.user;
      if (record.username !== username && !record.read) {
        addResponseMessage(
          `${record.date} **${record.nickname}:** \n\n ${record.message}`,
        );
        dispatch(incChatMessageCount());
      }
    });

    this.hwrSocket.on('motor_position', (record) => {
      dispatch(saveMotorPosition(record.name, record.position));
    });

    this.hwrSocket.on('motor_state', (record) => {
      dispatch(updateMotorState(record.name, record.state));
    });

    this.hwrSocket.on('update_shapes', (record) => {
      dispatch(setShapes(record.shapes));
    });

    this.hwrSocket.on('update_pixels_per_mm', (record) => {
      dispatch(setPixelsPerMm(record.pixelsPerMm));
    });

    this.hwrSocket.on('beam_changed', (record) => {
      dispatch(setBeamInfo(record.data));
    });

    this.hwrSocket.on('hardware_object_changed', (data) => {
      dispatch(updateBeamlineHardwareObjectAction(data));
    });

    this.hwrSocket.on('hardware_object_attribute_changed', (data) => {
      dispatch(updateBeamlineHardwareObjectAttributeAction(data));
    });

    this.hwrSocket.on('hardware_object_value_changed', (data) => {
      dispatch(updateBeamlineHardwareObjectValueAction(data));
    });

    this.hwrSocket.on('grid_result_available', (data) => {
      dispatch(updateShapesAction([data.shape]));
    });

    this.hwrSocket.on('energy_scan_result', (data) => {
      dispatch(setEnergyScanResult(data.pk, data.ip, data.rm));
    });

    this.hwrSocket.on('update_task_lims_data', (record) => {
      dispatch(
        updateTaskLimsData(
          record.sample,
          record.taskIndex,
          record.limsResultData,
        ),
      );
    });

    this.hwrSocket.on('task', (record, callback) => {
      if (callback) {
        callback();
      }

      // The current node might not be a task, in that case ignore it
      if (
        store.getState().queueGUI.displayData[record.queueID] &&
        record.taskIndex !== null
      ) {
        const taskCollapsed =
          store.getState().queueGUI.displayData[record.queueID].collapsed;

        if (
          (record.state === 1 && !taskCollapsed) ||
          (record.state >= 2 && taskCollapsed)
        ) {
          dispatch(collapseItem(record.queueID));
        }

        dispatch(
          addTaskResultAction(
            record.sample,
            record.taskIndex,
            record.state,
            record.progress,
            record.limsResultData,
            record.queueID,
          ),
        );
      }
    });

    this.hwrSocket.on('add_task', (record) => {
      dispatch(addTaskAction(record.tasks));
    });

    this.hwrSocket.on('add_diff_plan', (record, callback) => {
      if (callback) {
        callback();
      }
      dispatch(addDiffractionPlanAction(record.tasks));
    });

    this.hwrSocket.on('queue', (record) => {
      if (record.Signal === 'DisableSample') {
        dispatch(setSampleAttribute([record.sampleID], 'checked', false));
      } else if (record.Signal === 'update') {
        if (record.message === 'all') {
          dispatch(getQueue());
        } else if (record.message === 'observers') {
          const state = store.getState();
          if (!state.login.user.inControl) {
            dispatch(getQueue());
          }
        }
      } else {
        dispatch(setStatus(record.Signal));
      }
    });

    this.hwrSocket.on('sc', (record) => {
      switch (record.signal) {
        case 'operatingSampleChanger': {
          dispatch(
            showWaitDialog(
              'Sample changer in operation',
              record.message,
              true,
              () => dispatch(stopQueue()),
            ),
          );

          break;
        }

        case 'loadingSample':
        case 'loadedSample': {
          dispatch(
            showWaitDialog(
              `Loading sample ${record.location}`,
              record.message,
              true,
              () => dispatch(stopQueue()),
            ),
          );

          break;
        }

        case 'unLoadingSample':
        case 'unLoadedSample': {
          dispatch(
            showWaitDialog(
              `Unloading sample ${record.location}`,
              record.message,
              true,
              () => dispatch(stopQueue()),
            ),
          );

          break;
        }

        case 'loadReady': {
          dispatch(hideWaitDialog());
          break;
        }

        case 'inSafeArea': {
          dispatch(hideWaitDialog());
          break;
        }

        // No default
      }
    });

    this.hwrSocket.on('sample_centring', (data) => {
      if (data.method === CLICK_CENTRING) {
        dispatch(startClickCentringAction());
        const msg =
          '3-Click Centring: <br /> Select centered position or center';
        dispatch(videoMessageOverlay(true, msg));
      } else {
        const msg = 'Auto loop centring: <br /> Save position or re-center';
        dispatch(videoMessageOverlay(true, msg));
      }
    });

    this.hwrSocket.on('resumeQueueDialog', () => {
      dispatch(showResumeQueueDialog(true));
    });

    this.hwrSocket.on('userChanged', async (message) => {
      const { inControl: wasInControl, requestsControl: wasRequestingControl } =
        store.getState().login.user;

      await dispatch(getLoginInfo());

      const newState = store.getState();
      const { inControl, requestsControl } = newState.login.user;
      const hasIncomingRequest = newState.remoteAccess.observers.some(
        (o) => o.requestsControl,
      );

      if (!wasInControl && inControl && !hasIncomingRequest) {
        dispatch(showWaitDialog('You were given control', message));
      } else if (wasInControl && !inControl) {
        dispatch(showWaitDialog('You lost control'));
      } else if (wasRequestingControl && !requestsControl && !inControl) {
        dispatch(showWaitDialog('You were denied control', message));
      }
    });

    this.hwrSocket.on('observersChanged', () => {
      dispatch(getRaState());
    });

    this.hwrSocket.on('observerLogout', (observer) => {
      addResponseMessage(
        `**${observer.nickname}** (${observer.ip}) disconnected.`,
      );
    });

    this.hwrSocket.on('observerLogin', (observer) => {
      if (observer.nickname && observer.ip) {
        addResponseMessage(
          `**${observer.nickname}** (${observer.ip}) connected.`,
        );
      } else {
        addResponseMessage(`${observer.nickname} connecting ...`);
      }
    });

    this.hwrSocket.on('forceSignout', () => {
      this.disconnect();
      dispatch(signOut());
    });

    this.hwrSocket.on('workflowParametersDialog', (data) => {
      if (data) {
        dispatch(showWorkflowParametersDialog(data, true));
      } else {
        dispatch(showWorkflowParametersDialog(null, false));
      }
    });

    this.hwrSocket.on('gphlWorkflowParametersDialog', (data) => {
      dispatch(showGphlWorkflowParametersDialog(data));
    });

    this.hwrSocket.on('gphlWorkflowUpdateUiParametersDialog', (data) => {
      dispatch(updateGphlWorkflowParametersDialog(data));
    });

    this.hwrSocket.on('take_xtal_snapshot', (cb) => {
      cb(window.takeSnapshot());
    });

    this.hwrSocket.on('beamline_action', (data) => {
      dispatch(setActionState(data.name, data.state, data.data));
    });

    this.hwrSocket.on('sc_state', (state) => {
      dispatch(setSCState(state));
    });

    this.hwrSocket.on('loaded_sample_changed', (data) => {
      dispatch(setLoadedSample(data));
    });

    this.hwrSocket.on('set_current_sample', (sample) => {
      dispatch(setCurrentSample(sample.sampleID));
    });

    this.hwrSocket.on('sc_maintenance_update', (data) => {
      dispatch(setSCGlobalState(data));
    });

    this.hwrSocket.on('sc_contents_update', () => {
      dispatch(updateSCContents());
    });

    this.hwrSocket.on('diff_phase_changed', (data) => {
      dispatch(setCurrentPhase(data.phase));
    });

    this.hwrSocket.on('new_plot', (plotInfo) => {
      dispatch(newPlot(plotInfo));
    });

    this.hwrSocket.on('plot_data', (data) => {
      dispatch(plotData(data.id, data.data, false));
    });

    this.hwrSocket.on('plot_end', (data) => {
      dispatch(plotData(data.id, data.data, true));
      dispatch(plotEnd(data));
    });

    this.hwrSocket.on('harvester_state', (state) => {
      dispatch(setHarvesterState(state));
    });

    this.hwrSocket.on('harvester_contents_update', () => {
      dispatch(updateHarvesterContents());
    });
  }

  connectLogging() {
    this.loggingSocket = io.connect(`/logging`);

    this.loggingSocket.on('connect', () => {
      console.log('loggingSocket connected!'); // eslint-disable-line no-console
    });

    this.loggingSocket.on('connect_error', (error) => {
      console.error('loggingSocket connection error:', error.message); // eslint-disable-line no-console
    });

    this.loggingSocket.on('disconnect', (reason) => {
      console.log('loggingSocket disconnected!'); // eslint-disable-line no-console

      if (reason === 'io server disconnect') {
        const socket = this.loggingSocket;
        setTimeout(() => {
          socket.connect();
        }, 500);
      }
    });

    this.loggingSocket.on('log_record', (record) => {
      if (record.severity !== 'DEBUG') {
        dispatch(addUserMessage(record));
      }
      dispatch(addLogRecord(record));
    });
  }
}

export const serverIO = new ServerIO();
