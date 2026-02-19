/* eslint-disable promise/prefer-await-to-callbacks */
import { connect } from 'socket.io-client';

import {
  updateBeamlineHardwareObjectAction,
  updateBeamlineHardwareObjectAttributeAction,
  updateBeamlineHardwareObjectValueAction,
} from './actions/beamline';
import {
  addUserMessage,
  newPlot,
  plotData,
  plotEnd,
  setActionState,
} from './actions/beamlineActions';
import { showConnectionLostDialog, showErrorPanel } from './actions/general';
import {
  setHarvesterState,
  updateHarvesterContents,
} from './actions/harvester';
import { addLogRecord } from './actions/logger';
import { getLoginInfo, signOut } from './actions/login';
import {
  addDiffractionPlanAction,
  addTaskAction,
  addTaskResultAction,
  getQueue,
  setCurrentSample,
  setSampleAttribute,
  setStatus,
  stopQueue,
} from './actions/queue';
import { collapseItem, showResumeQueueDialog } from './actions/queueGUI';
import { addChatMessage, getRaState } from './actions/remoteAccess';
import {
  setLoadedSample,
  setSCGlobalState,
  setSCState,
} from './actions/sampleChanger';
import {
  saveMotorPosition,
  setBeamInfo,
  setCurrentPhase,
  setPixelsPerMm,
  setShapes,
  startClickCentringAction,
  updateMotorState,
  updateShapesAction,
  videoMessageOverlay,
} from './actions/sampleview';
import { setEnergyScanResult } from './actions/taskResults';
import { hideWaitDialog, showWaitDialog } from './actions/waitDialog';
import {
  showGphlWorkflowParametersDialog,
  showWorkflowParametersDialog,
  updateGphlWorkflowParametersDialog,
} from './actions/workflow';
import { processChatMessageRecord } from './components/ChatComponent/chatMessages';
import { CLICK_CENTRING } from './constants';
import { store } from './store';

const { dispatch } = store;

class ServerIO {
  hwrSocket = null;
  loggingSocket = null;
  connectionLostTimeout;

  listen() {
    clearTimeout(this.connectionLostTimeout);
    this.disconnect(); // noop if `disconnect` is properly called on logout

    this.connectHwr();
    this.connectLogging();
  }

  disconnect() {
    this.hwrSocket?.disconnect();
    this.hwrSocket = null;

    this.loggingSocket?.disconnect();
    this.loggingSocket = null;
  }

  connectHwr() {
    this.hwrSocket = connect(`/hwr`);

    this.hwrSocket.on('connect', () => {
      console.log('hwrSocket connected!'); // eslint-disable-line no-console
      dispatch(showConnectionLostDialog(false));
    });

    this.hwrSocket.on('connect_error', (error) => {
      console.error('hwrSocket connection error:', error.message); // eslint-disable-line no-console
    });

    this.hwrSocket.on('disconnect', (reason) => {
      console.log('hwrSocket disconnected!'); // eslint-disable-line no-console

      if (reason === 'io server disconnect') {
        //
        // If socket disconnects with this reason, it is possible that our
        // session have become invalid.
        //
        // That is, we can establish connection to the server, but then we
        // get a 'unauthorized' response which closes the socket.
        //
        // Check if that is the case by fetching the login info. If our
        // session is invalid, getLoginInfo() will update state to
        // 'not logged in' and the login page will be shown.
        //
        dispatch(getLoginInfo());
      }

      this.connectionLostTimeout = setTimeout(() => {
        dispatch(
          // Show message if socket still hasn't reconnected (and wasn't manually disconnected in the first place)
          showConnectionLostDialog(this.hwrSocket && !this.hwrSocket.connected),
        );
      }, 2000);
    });

    this.hwrSocket.on('ra_chat_message', (record) => {
      const { username } = store.getState().login.user;
      if (record.username !== username) {
        const message = processChatMessageRecord(record, username);
        dispatch(addChatMessage(message));
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
      const numClicks = store.getState().general.clickCentringNumClicks;

      if (data.method === CLICK_CENTRING) {
        dispatch(startClickCentringAction());
        const msg = `${numClicks}-Click Centring: <br />Select centered position or center`;
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
      const message = {
        id: `sys-${Date.now()}-${Math.random()}`,
        type: 'response',
        text: `**${observer.nickname}** (${observer.ip}) disconnected.`,
        date: new Date().toISOString(),
      };
      dispatch(addChatMessage(message));
    });

    this.hwrSocket.on('observerLogin', (observer) => {
      const text =
        observer.nickname && observer.ip
          ? `**${observer.nickname}** (${observer.ip}) connected.`
          : `${observer.nickname} connecting ...`;

      const message = {
        id: `sys-${Date.now()}-${Math.random()}`,
        type: 'response',
        text,
        date: new Date().toISOString(),
      };
      dispatch(addChatMessage(message));
    });

    this.hwrSocket.on('forceSignout', () => {
      this.disconnect();
      dispatch(signOut());
    });

    this.hwrSocket.on('sessionsChanged', () => {
      dispatch(getLoginInfo());
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
      cb(globalThis.takeSnapshot());
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

    this.hwrSocket.on('update_queue', () => {
      dispatch(getQueue());
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
    this.loggingSocket = connect(`/logging`);

    this.loggingSocket.on('connect', () => {
      console.log('loggingSocket connected!'); // eslint-disable-line no-console
    });

    this.loggingSocket.on('connect_error', (error) => {
      console.error('loggingSocket connection error:', error.message); // eslint-disable-line no-console
    });

    this.loggingSocket.on('disconnect', () => {
      console.log('loggingSocket disconnected!'); // eslint-disable-line no-console
    });

    this.loggingSocket.on('log_record', (record) => {
      if (record.severity !== 'DEBUG') {
        dispatch(addUserMessage(record));
      }
      if (record.severity === 'CRITICAL') {
        dispatch(showErrorPanel(true, record.message));
      }
      dispatch(addLogRecord(record));
    });
  }
}

export const serverIO = new ServerIO();
