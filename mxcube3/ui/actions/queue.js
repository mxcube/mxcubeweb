import fetch from 'isomorphic-fetch';
import { setLoading, showErrorPanel } from './general';
import { showTaskForm } from './taskForm';

export function setSampleListAction(sampleList) {
  return { type: 'SET_SAMPLE_LIST', sampleList };
}


export function sendGetSampleList() {
  return function (dispatch) {
    dispatch(setLoading(true));
    fetch('mxcube/api/v0.1/sample_changer/samples_list', { credentials: 'include' })
                        .then(response => response.json())
                        .then(json => {
                          dispatch(setLoading(false));
                          dispatch(setSampleListAction(json));
                        }, () => {
                          dispatch(setLoading(false));
                          dispatch(showErrorPanel(true, 'Could not get samples list'));
                        });
  };
}


export function clearAll() {
  return {
    type: 'CLEAR_ALL'
  };
}


export function sendClearQueue() {
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
      }
    }).then(() => {
      dispatch(clearAll());
    });
  };
}


export function setManualMountAction(manual) {
  return { type: 'SET_MANUAL_MOUNT', manual };
}


export function sendManualMount(manual) {
  return function (dispatch) {
    return fetch('mxcube/api/v0.1/diffractometer/usesc', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ use_sc: !manual })
    }).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Could not toogle manual mode'));
      } else {
        dispatch(sendClearQueue());
        dispatch(setSampleListAction({}));
        dispatch(setManualMountAction(manual));
        if (manual) {
          dispatch(showTaskForm('AddSample'));
        }
      }
    });
  };
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


export function sendDeleteQueueItem(sid, tindex) {
  return fetch(`mxcube/api/v0.1/queue/${sid}/${tindex}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    }
  });
}


export function setSampleOrderAction(newSampleOrder) {
  return { type: 'SET_SAMPLE_ORDER', order: newSampleOrder };
}


export function addSampleAction(sampleData) {
  return { type: 'ADD_SAMPLE', sampleData };
}


export function appendSampleListAction(sampleData) {
  return { type: 'APPEND_TO_SAMPLE_LIST', sampleData };
}


export function removeSampleAction(sampleID) {
  return { type: 'REMOVE_SAMPLE', sampleID };
}


export function setStatus(queueState) {
  return { type: 'SET_QUEUE_STATUS', queueState };
}


export function collapseList(listName) {
  return {
    type: 'COLLAPSE_LIST',
    list_name: listName
  };
}


export function collapseSample(sampleID) {
  return {
    type: 'COLLAPSE_SAMPLE', sampleID
  };
}


export function collapseTask(sampleID, taskIndex) {
  return {
    type: 'COLLAPSE_TASK', sampleID, taskIndex
  };
}


export function setState(queueState) {
  return {
    type: 'QUEUE_STATE', queueState
  };
}


export function changeTaskOrderAction(sampleId, oldIndex, newIndex) {
  return {
    type: 'CHANGE_METHOD_ORDER', sampleId, oldIndex, newIndex
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


export function changeTaskOrder(sampleID, oldIndex, newIndex) {
  return function (dispatch) {
    dispatch(changeTaskOrderAction(sampleID, oldIndex, newIndex));

    sendChangeTaskOrder(sampleID, oldIndex, newIndex).then((response) => {
      if (response.status >= 400) {
        dispatch(changeTaskOrderAction(sampleID, newIndex, oldIndex));
        throw new Error('Could not change order');
      }
    });
  };
}


export function runSample(queueID) {
  return {
    type: 'RUN_SAMPLE', queueID
  };
}


export function setCurrentSample(sampleID) {
  return {
    type: 'SET_CURRENT_SAMPLE', sampleID
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


export function showRestoreDialog(queueState, show = true) {
  return {
    type: 'SHOW_RESTORE_DIALOG', queueState, show
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
  return function () {
    fetch('mxcube/api/v0.1/queue/stop', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to stop queue');
      }
    });
  };
}


export function setQueueAction(queue) {
  return { type: 'SET_QUEUE', queue };
}


export function sendSetQueue(queue) {
  return function () {
    return fetch('mxcube/api/v0.1/queue', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(queue)
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Could not set queue');
      }

      return response.json();
    });
  };
}


export function sendMountSample(sampleID) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/sample_changer/${sampleID}/mount`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to mount sample');
      } else {
        dispatch(setCurrentSample(sampleID));
      }
    });
  };
}


export function addSample(sampleData) {
  return function (dispatch) {
    const data = { ...sampleData, checked: true, tasks: [] };

    sendAddQueueItem([data]);
    dispatch(addSampleAction(data));
  };
}


export function appendSampleList(sampleData) {
  return function (dispatch) {
    dispatch(appendSampleListAction(sampleData));
  };
}


export function deleteSample(sampleID) {
  return function (dispatch) {
    sendDeleteQueueItem(sampleID, undefined);
    dispatch(removeSampleAction(sampleID));
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


export function setQueueAndRun(sampleID, taskIndex, queue) {
  return function (dispatch) {
    dispatch(sendSetQueue(queue)).then(() => {
      dispatch(sendRunQueue());
    });
  };
}


export function setQueueAndRunTask(sampleID, taskIndex, queue) {
  return function (dispatch) {
    dispatch(sendSetQueue(queue)).then(() => {
      dispatch(sendRunSample(sampleID, taskIndex));
    });
  };
}


export function removeTaskAction(sampleID, taskIndex) {
  return { type: 'REMOVE_TASK', sampleID, taskIndex };
}


export function deleteTask(sampleID, taskIndex) {
  return function (dispatch) {
    sendDeleteQueueItem(sampleID, taskIndex);
    dispatch(removeTaskAction(sampleID, taskIndex));
  };
}


export function addTaskAction(task) {
  return { type: 'ADD_TASK', task };
}


export function addTask(sampleID, parameters, queue, runNow) {
  return function (dispatch) {
    const task = { type: parameters.type,
                   label: parameters.type.split(/(?=[A-Z])/).join(' '),
                   sampleID,
                   parameters,
                   checked: true };

    dispatch(addTaskAction(task));
    const taskIndex = queue[sampleID].tasks.length - 1;

    sendAddQueueItem([task]).then((response) => {
      if (response.status >= 400) {
        dispatch(removeTaskAction(sampleID, taskIndex));
        throw new Error('The task could not be added to the server');
      } else {
        if (runNow) {
          dispatch(sendRunSample(sampleID, taskIndex));
        }
      }
    });
  };
}


export function addSampleAndTask(sampleID, parameters, sampleData, queue, runNow) {
  return function (dispatch) {
    const data = { ...sampleData,
                   checked: true,
                   tasks: [{ type: parameters.type,
                             label: parameters.type.split(/(?=[A-Z])/).join(' '),
                             sampleID,
                             parameters,
                             checked: true }] };

    dispatch(addSampleAction(data));

    sendAddQueueItem([data]).then((response) => {
      if (response.status >= 400) {
        dispatch(removeTaskAction(sampleID, 0));
        throw new Error('The sample could not be added to the server');
      } else {
        if (runNow) {
          dispatch(sendRunSample(sampleID, 0));
        }
      }
    });
  };
}


export function updateTaskAction(sampleID, taskIndex, taskData) {
  return { type: 'UPDATE_TASK', sampleID, taskIndex, taskData };
}


export function updateTask(sampleID, taskIndex, params, queue, runNow) {
  return function (dispatch) {
    const taskData = { ...queue[sampleID].tasks[taskIndex], parameters: params };
    updateTaskAction(sampleID, taskIndex, taskData);

    sendUpdateQueueItem(sampleID, taskIndex, taskData).then((response) => {
      if (response.status >= 400) {
        throw new Error('The task could not be modified on the server');
      } else {
        if (runNow) {
          dispatch(sendRunSample(sampleID, taskIndex));
        }
      }
    });
  };
}


export function addTaskResultAction(sampleID, taskIndex, state, progress) {
  return { type: 'ADD_TASK_RESULT', sampleID, taskIndex, state, progress };
}


export function sendUnmountSample(queueID) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/sample_changer/${queueID}/unmount`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
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

export function clearQueue() {
  return { type: 'CLEAR_QUEUE' };
}
