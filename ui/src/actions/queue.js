/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
import { showErrorPanel } from './general';
import { mountSample } from './sampleChanger'; // eslint-disable-line import/no-cycle
import { abortCentring, updateShapes } from './sampleview';
import { selectSamplesAction, clearSampleGrid } from './sampleGrid'; // eslint-disable-line import/no-cycle
import { TASK_UNCOLLECTED } from '../constants';
import {
  fetchQueueState,
  sendAddQueueItem,
  sendClearQueue,
  sendDeleteQueueItem,
  sendMoveTask,
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
  sendToggleCheckBox,
  sendUpdateQueueItem,
} from '../api/queue';
import { sendSetCentringMethod } from '../api/sampleview';

export function queueLoading(loading) {
  return { type: 'QUEUE_LOADING', loading };
}

export function clearAll() {
  return { type: 'CLEAR_ALL' };
}

export function setQueueAction(queue) {
  return {
    type: 'SET_QUEUE',
    sampleOrder: queue.sampleOrder,
    sampleList: queue.sampleList,
  };
}

export function setCurrentSample(sampleID) {
  return {
    type: 'SET_CURRENT_SAMPLE',
    sampleID,
  };
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
  return {
    type: 'SET_SAMPLE_ATTRIBUTE',
    sampleIDList,
    attr,
    value,
  };
}

export function clearCurrentSample() {
  return {
    type: 'CLEAR_CURRENT_SAMPLE',
  };
}

export function addSamplesToQueue(sampleDataList) {
  return async (dispatch) => {
    dispatch(queueLoading(true));

    try {
      const json = await sendAddQueueItem(sampleDataList);
      dispatch(setQueue(json));
    } catch (error) {
      if (error.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to add sample'));
      }
    }

    dispatch(queueLoading(false));
  };
}

export function addSampleAndMount(sampleData) {
  return (dispatch) => {
    dispatch(
      mountSample(sampleData, () => {
        sendAddQueueItem([sampleData])
          .then((json) => {
            dispatch(setQueue(json));
            dispatch(selectSamplesAction([sampleData.sampleID]));
          })
          .catch((error) => {
            if (error.status >= 400) {
              dispatch(showErrorPanel(true, 'Server refused to add sample'));
            }
          })
          .finally(() => dispatch(queueLoading(false)));
      }),
    );
  };
}

export function clearQueueAction() {
  return { type: 'CLEAR_QUEUE' };
}

export function clearQueue(clearQueueOnly = false) {
  return (dispatch) => {
    sendClearQueue().then(() => {
      dispatch(clearQueueAction());

      if (!clearQueueOnly) {
        dispatch(clearSampleGrid());
      }
    });
  };
}

export function setStatus(queueState) {
  return { type: 'SET_QUEUE_STATUS', queueState };
}

export function setState(queueState) {
  return {
    type: 'QUEUE_STATE',
    queueState,
  };
}

export function changeTaskOrderAction(sampleId, oldIndex, newIndex) {
  return {
    type: 'CHANGE_TASK_ORDER',
    sampleId,
    oldIndex,
    newIndex,
  };
}

export function moveTask(sampleID, oldIndex, newIndex) {
  return (dispatch) => {
    dispatch(queueLoading(true));

    sendMoveTask(sampleID, oldIndex, newIndex)
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(changeTaskOrderAction(sampleID, newIndex, oldIndex));
          dispatch(showErrorPanel(true, 'Could not move task'));
        }
      })
      .finally(() => {
        dispatch(queueLoading(false));
      });
  };
}

export function toggleChecked(sampleID, index) {
  return {
    type: 'TOGGLE_CHECKED',
    sampleID,
    index,
  };
}

export function startQueue(autoMountNext = true, sid = -1) {
  return () => {
    sendStartQueue(autoMountNext, sid);
  };
}

export function pauseQueue() {
  return () => {
    sendPauseQueue();
  };
}

export function resumeQueue() {
  return () => {
    sendResumeQueue();
  };
}

export function stopQueue() {
  return (dispatch) => {
    sendStopQueue().then(() => {
      dispatch(abortCentring());
    });
  };
}

export function runSample(sampleID, taskIndex) {
  return (dispatch) => {
    sendRunSample(sampleID, taskIndex)
      .then(() => {
        dispatch({ type: 'RUN_SAMPLE', queueID: sampleID });
      })
      .catch((error) => {
        if (error.status >= 400) {
          throw new Error('Server refused to run sample');
        }
      });
  };
}

export function removeTaskAction(sampleID, taskIndex, queueID = null) {
  return {
    type: 'REMOVE_TASK',
    sampleID,
    taskIndex,
    queueID,
  };
}

export function removeTaskListAction(taskList, queueIDList = null) {
  return {
    type: 'REMOVE_TASKS_LIST',
    taskList,
    queueIDList,
  };
}

export function setEnabledSample(sampleIDList, value) {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(queueLoading(true));

    const qidList = sampleIDList.map(
      (sampleID) => state.sampleGrid.sampleList[sampleID].queueID,
    );

    sendSetEnabledQueueItem(qidList, value)
      .then(() => {
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
      })
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(
            showErrorPanel(true, 'Server refused to set item enabled flag'),
          );
        }
      })
      .finally(() => dispatch(queueLoading(false)));
  };
}

export function deleteTask(sampleID, taskIndex) {
  return (dispatch, getState) => {
    const state = getState();
    const task = state.sampleGrid.sampleList[sampleID].tasks[taskIndex];

    if (task.state === TASK_UNCOLLECTED) {
      dispatch(queueLoading(true));
      sendDeleteQueueItem([[sampleID, taskIndex]])
        .then(() => {
          dispatch(removeTaskAction(sampleID, taskIndex, task.queueID));
        })
        .catch((error) => {
          if (error.status >= 400) {
            dispatch(showErrorPanel(true, 'Server refused to delete task'));
          }
        })
        .finally(() => dispatch(queueLoading(false)));
    }
  };
}

export function deleteTaskList(sampleIDList) {
  return (dispatch, getState) => {
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
    sendDeleteQueueItem(itemPosList)
      .then(() => {
        dispatch(removeTaskListAction(taskList, queueIDList));
      })
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to delete task'));
        }
      })
      .finally(() => dispatch(queueLoading(false)));
  };
}

export function addTaskAction(tasks) {
  return { type: 'ADD_TASKS', tasks };
}

export function updateTaskAction(sampleID, taskIndex, taskData) {
  return {
    type: 'UPDATE_TASK',
    sampleID,
    taskIndex,
    taskData,
  };
}

export function updateTask(sampleID, taskIndex, params, runNow) {
  return (dispatch, getState) => {
    const { sampleGrid } = getState();

    const taskData = {
      ...sampleGrid.sampleList[sampleID].tasks[taskIndex],
      parameters: params,
    };
    dispatch(queueLoading(true));

    sendUpdateQueueItem(
      sampleGrid.sampleList[sampleID].queueID,
      taskData.queueID,
      taskData,
    )
      .then((json) => {
        dispatch(updateTaskAction(sampleID, taskIndex, json));

        if (runNow) {
          dispatch(runSample(sampleID, taskIndex));
        }
      })
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(
            showErrorPanel(
              true,
              'The task could not be modified on the server',
            ),
          );
        }
      })
      .finally(() => dispatch(queueLoading(false)));
  };
}

export function addDiffractionPlanAction(tasks) {
  return { type: 'ADD_DIFF_PLAN', tasks };
}

export function addTask(sampleIDs, parameters, runNow) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return (dispatch, getState) => {
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

    sendAddQueueItem(samples)
      .then((json) => {
        dispatch(setQueue(json));
        if (runNow) {
          const sl = json.sampleList;
          const { taskIndex } =
            sl[sampleIDs[0]].tasks[sl[sampleIDs[0]].tasks.length - 1];
          dispatch(runSample(sampleIDs[0], taskIndex));
        }
      })
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(
            showErrorPanel(true, 'The task could not be added to the server'),
          );
        }
      })
      .finally(() => dispatch(queueLoading(false)));
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
  return {
    type: 'UPDATE_TASK_LIMS_DATA',
    sampleID,
    taskIndex,
    limsResultData,
  };
}

export function toggleCheckBox(data, index) {
  return (dispatch) => {
    sendToggleCheckBox(data.queueID).then(() => {
      dispatch(toggleChecked(data.sampleID, index));
    });
  };
}

export function deleteSamplesFromQueue(sampleIDList) {
  return (dispatch) => {
    dispatch(queueLoading(true));

    const itemPostList = sampleIDList.map((sampleID) => {
      return [sampleID, undefined];
    });

    sendDeleteQueueItem(itemPostList)
      .then(() => {
        dispatch(removeSamplesFromQueueAction(sampleIDList));
      })
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to delete sample'));
        }
      })
      .finally(() => dispatch(queueLoading(false)));
  };
}

export function setAutoMountAction(automount) {
  return { type: 'SET_AUTO_MOUNT_SAMPLE', automount };
}

export function setAutoMountSample(automount) {
  return (dispatch) => {
    sendSetAutoMountSample(automount)
      .then((json) => {
        let a = json.automount;
        a = a === undefined ? false : a;
        dispatch(setAutoMountAction(a));
      })
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(showErrorPanel(true, 'Could not set/unset automount'));
        }
      });
  };
}

export function setAutoAddDiffPlanAction(autoadd) {
  return { type: 'SET_AUTO_ADD_DIFFPLAN', autoadd };
}

export function setAutoAddDiffPlan(autoadddiffplan) {
  return (dispatch) => {
    return sendSetAutoAddDiffPlan(autoadddiffplan)
      .then((json) => {
        const a = json.auto_add_diffplan;
        dispatch(setAutoAddDiffPlanAction(a));
      })
      .catch((error) => {
        if (error.status >= 400) {
          dispatch(showErrorPanel(true, 'Could not set/unset automount'));
        }
      });
  };
}

export function setCentringMethod(centringMethod) {
  return (dispatch) => {
    sendSetCentringMethod(centringMethod).then(() => {
      dispatch(setCentringMethodAction(centringMethod));
    });
  };
}

export function setNumSnapshots(numSnapshots) {
  return (dispatch) => {
    sendSetNumSnapshots(numSnapshots).then((response) => {
      dispatch(setNumSnapshotsAction(numSnapshots));
    });
  };
}

export function setGroupFolder(path) {
  return (dispatch) => {
    sendSetGroupFolder(path).then((json) => {
      dispatch(setGroupFolderAction(json.path));
    });
  };
}

export function setQueueSettings(name, value) {
  return (dispatch) => {
    sendSetQueueSettings(name, value).then(() => {
      dispatch(setQueueSettingAction(name, value));
    });
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
