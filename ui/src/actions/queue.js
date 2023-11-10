/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable sonarjs/no-duplicate-string */
import fetch from 'isomorphic-fetch';
import { showErrorPanel } from './general';
import { loadSample } from './sampleChanger'; // eslint-disable-line import/no-cycle
import { sendAbortCentring, sendUpdateShapes } from './sampleview';
import { selectSamplesAction, clearSampleGrid } from './sampleGrid'; // eslint-disable-line import/no-cycle
import { TASK_UNCOLLECTED } from '../constants';
import {
  sendClearQueue,
  sendPauseQueue,
  sendResumeQueue,
  sendStartQueue,
  sendStopQueue,
} from '../api/queue';

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
      state.queue.current.sampleID !== loadedSampleId
    ) {
      // If queue contains sample loaded by sample changer, set it as the current sample (unless it already is)
      dispatch(setCurrentSample(loadedSampleId));
    }
  };
}

export function setCentringMethod(centringMethod) {
  return { type: 'SET_CENTRING_METHOD', centringMethod };
}

export function setQueueSetting(settingName, value) {
  return { type: 'SET_QUEUE_SETTING', settingName, value };
}

export function setNumSnapshots(n) {
  return { type: 'SET_NUM_SNAPSHOTS', n };
}

export function setGroupFolder(path) {
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

export function sendAddQueueItem(items) {
  return fetch('mxcube/api/v0.1/queue/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(items),
  });
}

export function addSamplesToQueue(sampleDataList) {
  return (dispatch) => {
    dispatch(queueLoading(true));

    sendAddQueueItem(sampleDataList)
      .then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to add sample'));
        }

        return response.json();
      })
      .then((data) => {
        dispatch(setQueue(data));
      })
      .finally(() => dispatch(queueLoading(false)));
  };
}

export function addSampleAndMount(sampleData) {
  return (dispatch) => {
    dispatch(
      loadSample(sampleData, () => {
        sendAddQueueItem([sampleData])
          .then((response) => {
            if (response.status >= 400) {
              dispatch(showErrorPanel(true, 'Server refused to add sample'));
            }
            return response.json();
          })
          .then((data) => {
            dispatch(setQueue(data));
            dispatch(selectSamplesAction([sampleData.sampleID]));
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

export function sendUpdateQueueItem(sid, tindex, data) {
  return fetch(`mxcube/api/v0.1/queue/${sid}/${tindex}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export function sendDeleteQueueItem(itemPosList) {
  return fetch('mxcube/api/v0.1/queue/delete', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify(itemPosList),
  });
}

export function sendSetEnabledQueueItem(qidList, value) {
  return fetch('mxcube/api/v0.1/queue/set_enabled', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ qidList, value }),
  });
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

export function sendChangeTaskOrder(sampleID, oldIndex, newIndex) {
  return fetch(
    `mxcube/api/v0.1/queue/${sampleID}/${oldIndex}/${newIndex}/swap`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    },
  );
}

export function sendMoveTask(sampleID, oldIndex, newIndex) {
  return fetch(
    `mxcube/api/v0.1/queue/${sampleID}/${oldIndex}/${newIndex}/move`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    },
  );
}

export function moveTask(sampleID, oldIndex, newIndex) {
  return (dispatch) => {
    dispatch(queueLoading(true));

    sendMoveTask(sampleID, oldIndex, newIndex).then((response) => {
      if (response.status >= 400) {
        dispatch(changeTaskOrderAction(sampleID, newIndex, oldIndex));
        dispatch(showErrorPanel(true, 'Could not move task'));
      }

      dispatch(queueLoading(false));
    });
  };
}

export function runSample(queueID) {
  return {
    type: 'RUN_SAMPLE',
    queueID,
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
      dispatch(sendAbortCentring());
    });
  };
}

export function sendRunSample(sampleID, taskIndex) {
  return (dispatch) => {
    fetch(`mxcube/api/v0.1/queue/${sampleID}/${taskIndex}/execute`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to run sample');
      } else {
        dispatch(runSample(sampleID));
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return (dispatch, getState) => {
    const state = getState();
    dispatch(queueLoading(true));

    const qidList = sampleIDList.map(
      (sampleID) => state.sampleGrid.sampleList[sampleID].queueID,
    );

    sendSetEnabledQueueItem(qidList, value)
      .then((response) => {
        if (response.status >= 400) {
          dispatch(
            showErrorPanel(true, 'Server refused to set item enabled flag'),
          );
        } else {
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
        .then((response) => {
          if (response.status >= 400) {
            dispatch(showErrorPanel(true, 'Server refused to delete task'));
          } else {
            dispatch(removeTaskAction(sampleID, taskIndex, task.queueID));
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
      .then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to delete task'));
        } else {
          dispatch(removeTaskListAction(taskList, queueIDList));
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
      .then((response) => {
        if (response.status >= 400) {
          dispatch(
            showErrorPanel(
              true,
              'The task could not be modified on the server',
            ),
          );
        }
        return response.json();
      })
      .then((data) => {
        dispatch(updateTaskAction(sampleID, taskIndex, data));

        if (runNow) {
          dispatch(sendRunSample(sampleID, taskIndex));
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
              sendUpdateShapes([{ id: task.parameters.shape, state: 'SAVED' }]),
            );
          }
          if (state.shapes.shapes[task.parameters.shape].t === 'L') {
            dispatch(
              sendUpdateShapes([
                {
                  id: state.shapes.shapes[task.parameters.shape].refs[0],
                  state: 'SAVED',
                },
              ]),
            );
            dispatch(
              sendUpdateShapes([
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
      .then((response) => {
        if (response.status >= 400) {
          dispatch(
            showErrorPanel(true, 'The task could not be added to the server'),
          );
        }
        return response.json();
      })
      .then((data) => {
        dispatch(setQueue(data));
        if (runNow) {
          const sl = data.sampleList;
          const { taskIndex } =
            sl[sampleIDs[0]].tasks[sl[sampleIDs[0]].tasks.length - 1];
          dispatch(sendRunSample(sampleIDs[0], taskIndex));
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

export function sendToggleCheckBox(data, index) {
  return (dispatch) => {
    fetch(`mxcube/api/v0.1/queue/${data.queueID}/toggle`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to toogle checked task');
      } else {
        dispatch(toggleChecked(data.sampleID, index));
      }
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
      .then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to delete sample'));
        } else {
          dispatch(removeSamplesFromQueueAction(sampleIDList));
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
    return fetch('mxcube/api/v0.1/queue/automount', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(automount),
    })
      .then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Could not set/unset automount'));
        }
        return response.json();
      })
      .then((response) => {
        let a = response.automount;
        a = a === undefined ? false : a;
        dispatch(setAutoMountAction(a));
      });
  };
}

export function setAutoAddDiffPlanAction(autoadd) {
  return { type: 'SET_AUTO_ADD_DIFFPLAN', autoadd };
}

export function setAutoAddDiffPlan(autoadddiffplan) {
  return (dispatch) => {
    return fetch('mxcube/api/v0.1/queue/auto_add_diffplan', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(autoadddiffplan),
    })
      .then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Could not set/unset automount'));
        }
        return response.json();
      })
      .then((response) => {
        const a = response.auto_add_diffplan;
        dispatch(setAutoAddDiffPlanAction(a));
      });
  };
}

export function sendSetCentringMethod(centringMethod) {
  return (dispatch) => {
    fetch('/mxcube/api/v0.1/sampleview/centring/centring_method', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ centringMethod }),
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error(
          `Server could not set centring method ${centringMethod}`,
        );
      } else {
        dispatch(setCentringMethod(centringMethod));
      }
    });
  };
}

export function sendSetNumSnapshots(numSnapshots) {
  return (dispatch) => {
    fetch('/mxcube/api/v0.1/queue/num_snapshots', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ numSnapshots }),
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error(
          `Server could not set number of snapshots ${numSnapshots}`,
        );
      } else {
        dispatch(setNumSnapshots(numSnapshots));
      }
    });
  };
}

export function sendSetGroupFolder(path) {
  return (dispatch) => {
    fetch('/mxcube/api/v0.1/queue/group_folder', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ path }),
    })
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(`Server could not set group folder ${path}`);
        }
        return response.json();
      })
      .then((response) => {
        dispatch(setGroupFolder(response.path));
      });
  };
}

export function sendSetQueueSettings(name, value) {
  return (dispatch) => {
    fetch('/mxcube/api/v0.1/queue/setting', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ name, value }),
    })
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(`Server could not set ${name} ${value}`);
        }
        return response.json();
      })
      .then((response) => {
        dispatch(setQueueSetting(name, value));
      });
  };
}

export function sendUpdateDependentFields(task_name, field_data) {
  return fetch('/mxcube/api/v0.1/queue/update_dependent_field', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ task_name, field_data }),
  }).then((response) => {
    return response.json();
  });
}

export function fetchQueue() {
  return async (dispatch) => {
    try {
      const response = await fetch('mxcube/api/v0.1/queue/queue_state', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        dispatch(setQueue(data.sampleList));
      } else {
        throw new Error(`Could not fetch queue`);
      }
    } catch (error) {
      console.log(error); // eslint-disable-line no-console
    }
  };
}
