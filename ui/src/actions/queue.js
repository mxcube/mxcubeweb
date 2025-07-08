import {
  fetchQueueState,
  sendAddQueueItem,
  sendClearQueue,
  sendDeleteQueueItem,
  sendPauseQueue,
  sendResumeQueue,
  sendRunSample,
  sendSetAutoAddDiffPlan,
  sendSetAutoMountSample,
  sendSetEnabledQueueItem,
  sendSetGroupFolder,
  sendSetNumSnapshots,
  sendSetQueueSettings,
  sendStartQueue,
  sendStopQueue,
  sendUpdateQueueItem,
} from '../api/queue';
import { sendSetCentringMethod } from '../api/sampleview';
import { TASK_UNCOLLECTED } from '../constants';
import { showErrorPanel } from './general';
import { mountSample } from './sampleChanger';
import { clearSampleGrid, selectSamplesAction } from './sampleGrid';
import { abortCentring, updateShapes } from './sampleview';

export function queueLoading(loading) {
  return { type: 'QUEUE_LOADING', loading };
}

export function clearAll() {
  return { type: 'CLEAR_ALL' };
}

export function setQueueAction(queue) {
  const { sampleOrder, sampleList } = queue;
  return { type: 'SET_QUEUE', sampleOrder, sampleList };
}

export function setCurrentSample(sampleID) {
  return { type: 'SET_CURRENT_SAMPLE', sampleID };
}

export function setQueue(queue) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(setQueueAction(queue));

    const { address: loadedSampleId } = state.sampleChanger.loadedSample;
    if (
      queue.sampleOrder.includes(loadedSampleId) &&
      state.queue.currentSampleID !== loadedSampleId
    ) {
      // If queue contains sample loaded by sample changer, set it as the current sample (unless it already is)
      dispatch(setCurrentSample(loadedSampleId));
    }
  };
}

export function setCentringMethodAction(centringMethod) {
  return { type: 'SET_CENTRING_METHOD', centringMethod };
}

export function setQueueSettingAction(settingName, value) {
  return { type: 'SET_QUEUE_SETTING', settingName, value };
}

export function setNumSnapshotsAction(n) {
  return { type: 'SET_NUM_SNAPSHOTS', n };
}

export function setGroupFolderAction(path) {
  return { type: 'SET_GROUP_FOLDER', path };
}

export function addSamplesToQueueAction(samplesData) {
  return { type: 'ADD_SAMPLES_TO_QUEUE', samplesData };
}

export function removeSamplesFromQueueAction(sampleIDList) {
  return { type: 'REMOVE_SAMPLES_FROM_QUEUE', sampleIDList };
}

export function setSampleAttribute(sampleIDList, attr, value) {
  return { type: 'SET_SAMPLE_ATTRIBUTE', sampleIDList, attr, value };
}

export function clearCurrentSample() {
  return { type: 'CLEAR_CURRENT_SAMPLE' };
}

export function addSamplesToQueue(sampleDataList) {
  return async (dispatch) => {
    dispatch(queueLoading(true));

    try {
      const json = await sendAddQueueItem(sampleDataList);
      dispatch(setQueue(json));
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to add sample'));
    }

    dispatch(queueLoading(false));
  };
}

export function addSampleAndMount(sampleData) {
  return async (dispatch) => {
    await dispatch(mountSample(sampleData));

    dispatch(queueLoading(true));
    try {
      const json = await sendAddQueueItem([sampleData]);
      dispatch(setQueue(json));
      dispatch(selectSamplesAction([sampleData.sampleID]));
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to add sample'));
    }
    dispatch(queueLoading(false));
  };
}

export function clearQueueAction() {
  return { type: 'CLEAR_QUEUE' };
}

export function clearQueue(clearQueueOnly = false) {
  return async (dispatch) => {
    await sendClearQueue();

    dispatch(clearQueueAction());
    if (!clearQueueOnly) {
      dispatch(clearSampleGrid());
    }
  };
}

export function setStatus(queueState) {
  return { type: 'SET_QUEUE_STATUS', queueState };
}

export function setState(queueState) {
  return { type: 'QUEUE_STATE', queueState };
}

export function startQueue(autoMountNext = true, sid = -1) {
  return () => sendStartQueue(autoMountNext, sid);
}

export function pauseQueue() {
  return () => sendPauseQueue();
}

export function resumeQueue() {
  return () => sendResumeQueue();
}

export function stopQueue() {
  return async (dispatch) => {
    await sendStopQueue();
    dispatch(abortCentring());
  };
}

export function runSample(sampleID, taskIndex) {
  return async (dispatch) => {
    try {
      await sendRunSample(sampleID, taskIndex);
      dispatch({ type: 'RUN_SAMPLE', queueID: sampleID });
    } catch {
      throw new Error('Server refused to run sample');
    }
  };
}

export function removeTaskAction(sampleID, taskIndex, queueID = null) {
  return { type: 'REMOVE_TASK', sampleID, taskIndex, queueID };
}

export function removeTaskListAction(taskList, queueIDList = null) {
  return { type: 'REMOVE_TASKS_LIST', taskList, queueIDList };
}

export function setEnabledSample(sampleIDList, value) {
  return async (dispatch, getState) => {
    const state = getState();
    dispatch(queueLoading(true));

    const qidList = sampleIDList.map(
      (sampleID) => state.sampleGrid.sampleList[sampleID].queueID,
    );

    try {
      await sendSetEnabledQueueItem(qidList, value);
      dispatch(setSampleAttribute(sampleIDList, 'checked', value));

      sampleIDList.forEach((sid) => {
        // If sample is loaded by SC, set as current
        if (state.sampleChanger.loadedSample.address === sid && value) {
          dispatch(setCurrentSample(sid));
        }

        if (state.sampleChanger.loadedSample.address === sid && !value) {
          dispatch(setCurrentSample(''));
        }
      });

      if (!value) {
        dispatch(removeSamplesFromQueueAction(sampleIDList));
      }
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to set item enabled flag'));
    }

    dispatch(queueLoading(false));
  };
}

export function deleteTask(sampleID, taskIndex) {
  return async (dispatch, getState) => {
    const state = getState();
    const task = state.sampleGrid.sampleList[sampleID].tasks[taskIndex];

    if (task.state !== TASK_UNCOLLECTED) {
      return;
    }

    dispatch(queueLoading(true));

    try {
      await sendDeleteQueueItem([[sampleID, taskIndex]]);
      dispatch(removeTaskAction(sampleID, taskIndex, task.queueID));
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to delete task'));
    }

    dispatch(queueLoading(false));
  };
}

export function deleteTaskList(sampleIDList) {
  return async (dispatch, getState) => {
    const state = getState();
    const itemPosList = [];
    const taskList = [];
    const queueIDList = [];

    sampleIDList.forEach((sid) => {
      state.sampleGrid.sampleList[sid].tasks.forEach((task, index) => {
        if (task.state === TASK_UNCOLLECTED) {
          itemPosList.push([sid, index]);
          taskList.push(task);
          queueIDList.push(task.queueID);
        }
      });
    });

    dispatch(queueLoading(true));

    try {
      await sendDeleteQueueItem(itemPosList);
      dispatch(removeTaskListAction(taskList, queueIDList));
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to delete task'));
    }

    dispatch(queueLoading(false));
  };
}

export function addTaskAction(tasks) {
  return { type: 'ADD_TASKS', tasks };
}

export function updateTaskAction(sampleID, taskIndex, taskData) {
  return { type: 'UPDATE_TASK', sampleID, taskIndex, taskData };
}

export function updateTask(sampleID, taskIndex, params, runNow) {
  return async (dispatch, getState) => {
    const { sampleGrid } = getState();

    const taskData = {
      ...sampleGrid.sampleList[sampleID].tasks[taskIndex],
      parameters: params,
    };

    dispatch(queueLoading(true));

    try {
      const json = await sendUpdateQueueItem(
        sampleGrid.sampleList[sampleID].queueID,
        taskData.queueID,
        taskData,
      );
      dispatch(updateTaskAction(sampleID, taskIndex, json));

      if (runNow) {
        dispatch(runSample(sampleID, taskIndex));
      }
    } catch {
      dispatch(
        showErrorPanel(true, 'The task could not be modified on the server'),
      );
    }

    dispatch(queueLoading(false));
  };
}

export function addDiffractionPlanAction(tasks) {
  return { type: 'ADD_DIFF_PLAN', tasks };
}

export function addTask(sampleIDs, parameters, runNow) {
  return async (dispatch, getState) => {
    const state = getState();
    const samples = [];
    let shapes = [];

    if (typeof parameters.shape === 'object') {
      shapes = Object.values(parameters.shape);
    } else {
      shapes.push(parameters.shape);
    }

    sampleIDs.forEach((sampleID) => {
      shapes.forEach((sh) => {
        const pars = { ...parameters, shape: sh };

        const task = {
          type: pars.type,
          label: pars.label,
          state: TASK_UNCOLLECTED,
          sampleID,
          sampleQueueID: state.sampleGrid.sampleList[sampleID].queueID,
          parameters: { ...pars },
          checked: true,
        };

        // If a task is created on a shape, save shape if not already saved before
        if (Number.parseInt(parameters.shape) !== -1) {
          if (state.shapes.shapes[task.parameters.shape].state === 'TMP') {
            dispatch(
              updateShapes([{ id: task.parameters.shape, state: 'SAVED' }]),
            );
          }
          if (state.shapes.shapes[task.parameters.shape].t === 'L') {
            dispatch(
              updateShapes([
                {
                  id: state.shapes.shapes[task.parameters.shape].refs[0],
                  state: 'SAVED',
                },
              ]),
            );
            dispatch(
              updateShapes([
                {
                  id: state.shapes.shapes[task.parameters.shape].refs[1],
                  state: 'SAVED',
                },
              ]),
            );
          }
        }

        const sample = { ...state.sampleGrid.sampleList[sampleID] };
        sample.tasks = [task];
        samples.push(sample);
      });
    });

    dispatch(queueLoading(true));

    try {
      const json = await sendAddQueueItem(samples);
      dispatch(setQueue(json));

      if (runNow) {
        const sl = json.sampleList;
        const { taskIndex } =
          sl[sampleIDs[0]].tasks[sl[sampleIDs[0]].tasks.length - 1];
        dispatch(runSample(sampleIDs[0], taskIndex));
      }
    } catch {
      dispatch(
        showErrorPanel(true, 'The task could not be added to the server'),
      );
    }

    dispatch(queueLoading(false));
  };
}

export function addTaskResultAction(
  sampleID,
  taskIndex,
  state,
  progress,
  limsResultData,
  queueID,
) {
  return {
    type: 'ADD_TASK_RESULT',
    sampleID,
    taskIndex,
    state,
    progress,
    limsResultData,
    queueID,
  };
}

export function updateTaskLimsData(sampleID, taskIndex, limsResultData) {
  return { type: 'UPDATE_TASK_LIMS_DATA', sampleID, taskIndex, limsResultData };
}

export function deleteSamplesFromQueue(sampleIDList) {
  return async (dispatch) => {
    dispatch(queueLoading(true));

    const itemPostList = sampleIDList.map((sampleID) => {
      return [sampleID, undefined];
    });

    try {
      await sendDeleteQueueItem(itemPostList);
      dispatch(removeSamplesFromQueueAction(sampleIDList));
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to delete sample'));
    }

    dispatch(queueLoading(false));
  };
}

export function setAutoMountAction(automount) {
  return { type: 'SET_AUTO_MOUNT_SAMPLE', automount };
}

export function setAutoMountSample(automount) {
  return async (dispatch) => {
    try {
      const json = await sendSetAutoMountSample(automount);

      dispatch(
        setAutoMountAction(
          json.automount === undefined ? false : json.automount,
        ),
      );
    } catch {
      dispatch(showErrorPanel(true, 'Could not set/unset automount'));
    }
  };
}

export function setAutoAddDiffPlanAction(autoadd) {
  return { type: 'SET_AUTO_ADD_DIFFPLAN', autoadd };
}

export function setAutoAddDiffPlan(autoadddiffplan) {
  return async (dispatch) => {
    try {
      const json = await sendSetAutoAddDiffPlan(autoadddiffplan);
      const a = json.autoadddiffplan;
      dispatch(setAutoAddDiffPlanAction(a));
    } catch {
      dispatch(showErrorPanel(true, 'Could not set/unset automount'));
    }
  };
}

export function setCentringMethod(centringMethod) {
  return async (dispatch) => {
    await sendSetCentringMethod(centringMethod);
    dispatch(setCentringMethodAction(centringMethod));
  };
}

export function setNumSnapshots(numSnapshots) {
  return async (dispatch) => {
    await sendSetNumSnapshots(numSnapshots);
    dispatch(setNumSnapshotsAction(numSnapshots));
  };
}

export function setGroupFolder(path) {
  return async (dispatch) => {
    const json = await sendSetGroupFolder(path);
    dispatch(setGroupFolderAction(json.path));
  };
}

export function setQueueSettings(name, value) {
  return async (dispatch) => {
    await sendSetQueueSettings(name, value);
    dispatch(setQueueSettingAction(name, value));
  };
}

export function getQueue() {
  return async (dispatch) => {
    try {
      const json = await fetchQueueState();
      dispatch(setQueue(json.sampleList));
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
    }
  };
}
