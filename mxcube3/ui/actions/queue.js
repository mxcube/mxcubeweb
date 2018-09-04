import fetch from 'isomorphic-fetch';
import { showErrorPanel } from './general';
import { sendAbortCentring, sendUpdateShapes } from './sampleview';
import { selectSamplesAction, clearSampleGrid } from '../actions/sampleGrid';
import { TASK_UNCOLLECTED } from '../constants';

export function queueLoading(loading) {
  return { type: 'QUEUE_LOADING', loading };
}


export function clearAll() {
  return { type: 'CLEAR_ALL' };
}


export function setQueueAction(queue) {
  return { type: 'SET_QUEUE', sampleOrder: queue.sampleOrder, sampleList: queue.sampleList };
}


export function setCurrentSample(sampleID) {
  return {
    type: 'SET_CURRENT_SAMPLE', sampleID
  };
}


export function setQueue(queue) {
  return function (dispatch, getState) {
    const state = getState();
    dispatch(setQueueAction(queue));

    // Check if sample is loaded by sample changer in that case set it as current sample
    queue.sampleOrder.forEach((sid) => {
      if (state.sampleChanger.loadedSample.address === sid &&
          state.queue.current.sampleID !== sid) {
        dispatch(setCurrentSample(sid));
      }
    });
  };
}


export function setCentringMethod(centringMethod) {
  return { type: 'SET_CENTRING_METHOD', centringMethod };
}


export function setNumSnapshots(n) {
  return { type: 'SET_NUM_SNAPSHOTS', n };
}


export function setGroupFolder(path) {
  return { type: 'SET_GROUP_FOLDER', path };
}


export function setRootPath(path) {
  return { type: 'SET_ROOT_PATH', path };
}


export function addSamplesToQueueAction(samplesData) {
  return { type: 'ADD_SAMPLES_TO_QUEUE', samplesData };
}


export function removeSamplesFromQueueAction(sampleIDList) {
  return { type: 'REMOVE_SAMPLES_FROM_QUEUE', sampleIDList };
}


export function setSampleAttribute(sampleID, attr, value) {
  return { type: 'SET_SAMPLE_ATTRIBUTE', sampleID, attr, value };
}


export function sendAddQueueItem(items) {
  return fetch('mxcube/api/v0.1/queue', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify(items)
  });
}


export function sendMountSample(sampleData, successCb = null) {
  return function (dispatch, getState) {
    const state = getState();

    if (state.sampleChanger.loadedSample.address !== sampleData.sampleID) {
      fetch('mxcube/api/v0.1/sample_changer/mount', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify(sampleData)
      }).then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, response.headers.get('message')));
          throw new Error('Server refused to mount sample');
        } else {
          setCurrentSample(sampleData.sampleID);

          if (successCb) {
            successCb();
          }
        }
      });
    }
  };
}


export function addSamplesToQueue(sampleDataList) {
  return function (dispatch) {
    dispatch(queueLoading(true));

    sendAddQueueItem(sampleDataList).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to add sample'));
      }

      return response.json();
    }).then((data) => {
      dispatch(setQueue(data));
    }).catch(() => (queueLoading(false))).then(() => (dispatch(queueLoading(false))));
  };
}


export function addSampleAndMount(sampleData) {
  return function (dispatch) {
    dispatch(sendMountSample(sampleData, () => {
      sendAddQueueItem([sampleData]).then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to add sample'));
        }

        return response.json();
      }).then((data) => {
        dispatch(setQueue(data));
        dispatch(selectSamplesAction([sampleData.sampleID]));
      }).catch(() => (queueLoading(false))).then(() => (dispatch(queueLoading(false))));
    }));
  };
}


export function clearQueue() {
  return { type: 'CLEAR_QUEUE' };
}


export function sendClearQueue(clearQueueOnly = false) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/queue/clear', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to clear queue');
      } else {
        if (clearQueueOnly) {
          dispatch(clearQueue());
        } else {
          dispatch(clearQueue());
          dispatch(clearSampleGrid());
        }
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
      'Content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}


export function sendDeleteQueueItem(itemPosList) {
  return fetch('mxcube/api/v0.1/queue/delete', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify(itemPosList)
  });
}


export function sendSetEnabledQueueItem(qidList, value) {
  return fetch('mxcube/api/v0.1/queue/set_enabled', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ qidList, value })
  });
}


export function setStatus(queueState) {
  return { type: 'SET_QUEUE_STATUS', queueState };
}


export function setState(queueState) {
  return {
    type: 'QUEUE_STATE', queueState
  };
}


export function changeTaskOrderAction(sampleId, oldIndex, newIndex) {
  return {
    type: 'CHANGE_TASK_ORDER', sampleId, oldIndex, newIndex
  };
}


export function sendChangeTaskOrder(sampleID, oldIndex, newIndex) {
  return fetch(`mxcube/api/v0.1/queue/${sampleID}/${oldIndex}/${newIndex}/swap`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    }
  });
}


export function sendMoveTask(sampleID, oldIndex, newIndex) {
  return fetch(`mxcube/api/v0.1/queue/${sampleID}/${oldIndex}/${newIndex}/move`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    }
  });
}


export function moveTask(sampleID, oldIndex, newIndex) {
  return function (dispatch) {
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
    type: 'RUN_SAMPLE', queueID
  };
}


export function clearCurrentSample() {
  return {
    type: 'CLEAR_CURRENT_SAMPLE'
  };
}


export function toggleChecked(sampleID, index) {
  return {
    type: 'TOGGLE_CHECKED', sampleID, index
  };
}


export function sendRunQueue(autoMountNext = true, sid = -1) {
  return function () {
    fetch('mxcube/api/v0.1/queue/start', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ autoMountNext, sid })
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to start queue');
      }
    });
  };
}


export function sendPauseQueue() {
  return function () {
    fetch('mxcube/api/v0.1/queue/pause', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to pause queue');
      }
    });
  };
}


export function sendUnpauseQueue() {
  return function () {
    fetch('mxcube/api/v0.1/queue/unpause', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to unpause queue');
      }
    });
  };
}


export function sendStopQueue() {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/queue/stop', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      dispatch(sendAbortCentring());
      if (response.status >= 400) {
        throw new Error('Server refused to stop queue');
      }
    });
  };
}


export function sendRunSample(sampleID, taskIndex) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${sampleID}/${taskIndex}/execute`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
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
  return { type: 'REMOVE_TASK', sampleID, taskIndex, queueID };
}


export function setEnabledSample(sampleIDList, value) {
  return function (dispatch, getState) {
    const state = getState();
    dispatch(queueLoading(true));

    const qidList = sampleIDList.map(sampleID => (
      state.sampleGrid.sampleList[sampleID].queueID
    ));

    sendSetEnabledQueueItem(qidList, value).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to set item enabled flag'));
      } else {
        sampleIDList.forEach(sid => {
          dispatch(setSampleAttribute(sid, 'checked', value));

          // If sample is loaded by SC, set as current
          if (state.sampleChanger.loadedSample.address === sid && value) {
            dispatch(setCurrentSample(sid));
          }

          if (state.sampleChanger.loadedSample.address === sid && !value) {
            dispatch(setCurrentSample(''));
          }

          if (!value && state.queue.queue.includes(sid)) {
            dispatch(removeSamplesFromQueueAction([sid]));
          }
        });
      }
    }).catch(() => (queueLoading(false))).then(() => (dispatch(queueLoading(false))));
  };
}


export function deleteTask(sampleID, taskIndex) {
  return function (dispatch, getState) {
    const state = getState();
    const task = state.sampleGrid.sampleList[sampleID].tasks[taskIndex];

    if (task.state === TASK_UNCOLLECTED) {
      dispatch(queueLoading(true));

      sendDeleteQueueItem([[sampleID, taskIndex]]).then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to delete task'));
        } else {
          dispatch(removeTaskAction(sampleID, taskIndex, task.queueID));
        }

        dispatch(queueLoading(false));
      });
    }
  };
}


export function addTaskAction(tasks) {
  return { type: 'ADD_TASKS', tasks };
}

export function updateTaskAction(sampleID, taskIndex, taskData) {
  return { type: 'UPDATE_TASK', sampleID, taskIndex, taskData };
}


export function updateTask(sampleID, taskIndex, params, runNow) {
  return function (dispatch, getState) {
    const { sampleGrid } = getState();

    const taskData = { ...sampleGrid.sampleList[sampleID].tasks[taskIndex], parameters: params };
    dispatch(queueLoading(true));

    sendUpdateQueueItem(sampleGrid.sampleList[sampleID].queueID, taskData.queueID, taskData).
      then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'The task could not be modified on the server'));
        }
        return response.json();
      }).then((data) => {
        dispatch(updateTaskAction(sampleID, taskIndex, data));

        if (runNow) {
          dispatch(sendRunSample(sampleID, taskIndex));
        }
      }).catch(() => (queueLoading(false))).then(() => (dispatch(queueLoading(false))));
  };
}

export function addDiffractionPlanAction(tasks) {
  return { type: 'ADD_DIFF_PLAN', tasks };
}

export function addTask(sampleIDs, parameters, runNow) {
  return function (dispatch, getState) {
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

        const task = { type: pars.type,
                       label: pars.label,
                       state: TASK_UNCOLLECTED,
                       sampleID,
                       sampleQueueID: state.sampleGrid.sampleList[sampleID].queueID,
                       parameters: { ...pars },
                       checked: true };

        // If a task is created on a shape, save shape if not already saved before
        if (parameters.shape !== -1 && parameters.shape !== undefined) {
          if (state.shapes.shapes[task.parameters.shape].state === 'TMP') {
            dispatch(sendUpdateShapes([{ id: task.parameters.shape, state: 'SAVED' }]));
          }
          if (state.shapes.shapes[task.parameters.shape].t === 'L') {
            dispatch(sendUpdateShapes([{ id: state.shapes.shapes[task.parameters.shape].refs[0],
                                         state: 'SAVED' }]));
            dispatch(sendUpdateShapes([{ id: state.shapes.shapes[task.parameters.shape].refs[1],
                                         state: 'SAVED' }]));
          }
        }

        const sample = Object.assign({}, state.sampleGrid.sampleList[sampleID]);
        sample.tasks = [task];
        samples.push(sample);
      });
    });

    dispatch(queueLoading(true));

    sendAddQueueItem(samples).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'The task could not be added to the server'));
      }
      return response.json();
    }).then((data) => {
      dispatch(setQueue(data));
      if (runNow) {
        const sl = data.sampleList;
        const taskIndex = sl[sampleIDs[0]].tasks[sl[sampleIDs[0]].tasks.length - 1].taskIndex;
        dispatch(sendRunSample(sampleIDs[0], taskIndex));
      }
    }).catch(() => (queueLoading(false))).then(() => (dispatch(queueLoading(false))));
  };
}


export function addTaskResultAction(sampleID, taskIndex, state, progress, limsResultData, queueID) {
  return { type: 'ADD_TASK_RESULT', sampleID, taskIndex, state, progress, limsResultData, queueID };
}

export function updateTaskLimsData(sampleID, taskIndex, limsResultData) {
  return { type: 'UPDATE_TASK_LIMS_DATA', sampleID, taskIndex, limsResultData };
}


export function sendUnmountSample(sample) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/sample_changer/unmount', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(sample)
    }).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, response.headers.get('message')));
        throw new Error('Server refused to unmount sample');
      } else {
        dispatch(clearCurrentSample());
      }
    });
  };
}


export function sendToggleCheckBox(data, index) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${data.queueID}/toggle`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
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
  return function (dispatch) {
    dispatch(queueLoading(true));

    const itemPostList = sampleIDList.map(sampleID => {
      const itemPos = [sampleID, undefined];
      return itemPos;
    });

    sendDeleteQueueItem(itemPostList).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to delete sample'));
      } else {
        dispatch(removeSamplesFromQueueAction(sampleIDList));
      }
    }).catch(() => (queueLoading(false))).then(() => (dispatch(queueLoading(false))));
  };
}


export function setAutoMountAction(automount) {
  return { type: 'SET_AUTO_MOUNT_SAMPLE', automount };
}


export function setAutoMountSample(automount) {
  return function (dispatch) {
    return fetch('mxcube/api/v0.1/queue/automount', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(automount)
    }).then(response => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Could not set/unset automount'));
      }
      return response.json();
    }).then(response => {
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
  return function (dispatch) {
    return fetch('mxcube/api/v0.1/queue/auto_add_diffplan', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(autoadddiffplan)
    }).then(response => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Could not set/unset automount'));
      }
      return response.json();
    }).then(response => {
      const a = response.auto_add_diffplan;
      dispatch(setAutoAddDiffPlanAction(a));
    });
  };
}

export function sendSetCentringMethod(centringMethod) {
  return function (dispatch) {
    fetch('/mxcube/api/v0.1/sampleview/centring/centring_method', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ centringMethod })
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error(`Server could not set centring method ${centringMethod}`);
      } else {
        dispatch(setCentringMethod(centringMethod));
      }
    });
  };
}

export function sendSetNumSnapshots(numSnapshots) {
  return function (dispatch) {
    fetch('/mxcube/api/v0.1/queue/num_snapshots', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ numSnapshots })
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error(`Server could not set number of snapshots ${numSnapshots}`);
      } else {
        dispatch(setNumSnapshots(numSnapshots));
      }
    });
  };
}

export function sendSetGroupFolder(path) {
  return function (dispatch) {
    fetch('/mxcube/api/v0.1/queue/group_folder', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ path })
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error(`Server could not set group folder ${path}`);
      }
      return response.json();
    }).then((response) => {
      dispatch(setGroupFolder(response.path));
    });
  };
}
