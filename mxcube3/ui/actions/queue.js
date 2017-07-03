import fetch from 'isomorphic-fetch';
import { showErrorPanel } from './general';
import { sendAbortCentring, sendUpdateShape } from './sampleview';
import { selectSamplesAction, clearSampleGrid } from '../actions/sampleGrid';
import { TASK_UNCOLLECTED } from '../constants';

export function queueLoading(loading) {
  return { type: 'QUEUE_LOADING', loading };
}


export function clearAll() {
  return { type: 'CLEAR_ALL' };
}


export function setQueueAction(queue) {
  return { type: 'SET_QUEUE', queue };
}


export function addSamplesToQueueAction(samplesData) {
  return { type: 'ADD_SAMPLES_TO_QUEUE', samplesData };
}


export function removeSamplesFromQueueAction(sampleIDList) {
  return { type: 'REMOVE_SAMPLES_FROM_QUEUE', sampleIDList };
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


export function setCurrentSample(sampleID) {
  return {
    type: 'SET_CURRENT_SAMPLE', sampleID
  };
}


export function sendMountSample(sampleData) {
  return function (dispatch) {
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
        throw new Error('Server refused to mount sample');
      } else {
        dispatch(setCurrentSample(sampleData.sampleID));
      }
    });
  };
}


export function addSamplesToQueue(sampleDataList) {
  return function (dispatch) {
    dispatch(queueLoading(true));

    sendAddQueueItem(sampleDataList).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to add sample'));
      } else {
        dispatch(addSamplesToQueueAction(sampleDataList));
      }
      dispatch(queueLoading(false));
    });
  };
}


export function addSampleAndMount(sampleData) {
  return function (dispatch) {
    sendAddQueueItem([sampleData]).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to add sample'));
      } else {
        dispatch(addSamplesToQueueAction([sampleData]));
        dispatch(selectSamplesAction([sampleData.sampleID]));
        dispatch(sendMountSample(sampleData));
      }
    });
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


function sendSetQueue(queue) {
  return fetch('mxcube/api/v0.1/queue', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify(queue)
  });
}


export function setQueue(queueSamples, queueSamplesOrder) {
  const queue = queueSamplesOrder.map(key => queueSamples[key]);

  return function (dispatch) {
    return sendSetQueue(queue).then(response => {
      if (response.status >= 400) {
        throw new Error('Server refused to set queue');
      } else {
        dispatch(setQueueAction(queue));
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


export function sendRunQueue() {
  return function () {
    fetch('mxcube/api/v0.1/queue/start', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
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


export function removeTaskAction(sampleID, taskIndex) {
  return { type: 'REMOVE_TASK', sampleID, taskIndex };
}


export function deleteTask(sampleID, taskIndex) {
  return function (dispatch, getState) {
    const state = getState();

    if (state.sampleGrid.sampleList[sampleID].tasks[taskIndex].state === TASK_UNCOLLECTED) {
      dispatch(queueLoading(true));
      sendDeleteQueueItem([[sampleID, taskIndex]]).then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'Server refused to delete task'));
        } else {
          dispatch(removeTaskAction(sampleID, taskIndex));
        }
        dispatch(queueLoading(false));
      });
    }
  };
}


export function addTaskAction(tasks) {
  return { type: 'ADD_TASKS', tasks };
}


export function addTask(sampleIDs, parameters, runNow) {
  return function (dispatch, getState) {
    const state = getState();
    const tasks = [];
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
                       parameters: { ...pars },
                       checked: true };

        // If a task is created on a shape, save shape if not already saved before
        if (parameters.shape !== -1) {
          if (state.shapes.shapes[task.parameters.shape].state === 'TMP') {
            dispatch(sendUpdateShape(task.parameters.shape, { state: 'SAVED' }));
          }

          if (state.shapes.shapes[task.parameters.shape].t === 'L') {
            dispatch(sendUpdateShape(state.shapes.shapes[task.parameters.shape].refs[0],
                                     { state: 'SAVED' }));
            dispatch(sendUpdateShape(state.shapes.shapes[task.parameters.shape].refs[1],
                                      { state: 'SAVED' }));
          }
        }

        // If a task is added on a sample that is not in the queue, add the sample
        // to the queue.
        if (!state.queue.queue.includes(sampleID)) {
          const sample = Object.assign({}, state.sampleGrid.sampleList[sampleID]);
          sample.tasks = [task];
          samples.push(sample);
        } else {
          tasks.push(task);
        }
      });
    });

    dispatch(queueLoading(true));

    if (samples.length) {
      dispatch(addSamplesToQueue(samples));
    }

    if (tasks.length) {
      sendAddQueueItem(tasks).then((response) => {
        if (response.status >= 400) {
          dispatch(showErrorPanel(true, 'The task could not be added to the server'));
        } else {
          dispatch(addTaskAction(tasks));
          if (runNow) {
            const taskIndex = state.sampleGrid.sampleList[sampleIDs[0]].tasks.length;
            dispatch(sendRunSample(sampleIDs[0], taskIndex));
          }
        }
        dispatch(queueLoading(false));
      });
    }
  };
}


export function updateTaskAction(sampleID, taskIndex, taskData) {
  return { type: 'UPDATE_TASK', sampleID, taskIndex, taskData };
}


export function updateTask(sampleID, taskIndex, params, runNow) {
  return function (dispatch, getState) {
    const { sampleGrid } = getState();
    const taskData = { ...sampleGrid.sampleList[sampleID].tasks[taskIndex], parameters: params };
    dispatch(queueLoading(true));
    sendUpdateQueueItem(sampleID, taskIndex, taskData).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'The task could not be modified on the server'));
      } else {
        dispatch(updateTaskAction(sampleID, taskIndex, taskData));
        if (runNow) {
          dispatch(sendRunSample(sampleID, taskIndex));
        }
      }
      dispatch(queueLoading(false));
    });
  };
}


export function addTaskResultAction(sampleID, taskIndex, state, progress, limsResultData) {
  return { type: 'ADD_TASK_RESULT', sampleID, taskIndex, state, progress, limsResultData };
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

      dispatch(queueLoading(false));
    });
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
