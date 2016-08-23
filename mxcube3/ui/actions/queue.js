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


export function setSampleOrderAction(newSampleOrder, keys) {
  return { type: 'SET_SAMPLE_ORDER', order: newSampleOrder, keys };
}


export function addSampleAction(sampleID, sampleData) {
  return { type: 'ADD_SAMPLE', sampleID, sampleData };
}


export function appendSampleListAction(sampleID, sampleData) {
  return { type: 'APPEND_TO_SAMPLE_LIST', sampleID, sampleData };
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


export function changeOrder(listName, oldIndex, newIndex) {
  return {
    type: 'CHANGE_QUEUE_ORDER', listName, oldIndex, newIndex
  };
}


export function changeTaskOrder(sampleId, oldIndex, newIndex) {
  return {
    type: 'CHANGE_METHOD_ORDER', sampleId, oldIndex, newIndex
  };
}


export function runSample(queueID) {
  return {
    type: 'RUN_SAMPLE', queueID
  };
}


export function mountSample(sampleID) {
  return {
    type: 'MOUNT_SAMPLE', sampleID
  };
}


export function unmountSample(queueID) {
  return {
    type: 'UNMOUNT_SAMPLE', queueID
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
        dispatch(mountSample(sampleID));
      }
    });
  };
}


export function addSample(sampleID, sampleData) {
  return function (dispatch) {
    dispatch(addSampleAction(sampleID, sampleData));

    // Its perhaps possible to not even sendMountSample at this point,
    // does it even make sense ?
    dispatch(sendMountSample(sampleID));
  };
}


export function appendSampleList(sampleID, sampleData) {
  return function (dispatch) {
    dispatch(appendSampleListAction(sampleID, sampleData));
  };
}


export function deleteSample(sampleID) {
  return function (dispatch) {
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
      dispatch(sendRunSample(sampleID, taskIndex));
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


export function addTaskAction(sampleID, parameters, queueID) {
  return { type: 'ADD_TASK',
           sampleID,
           queueID,
           parameters
  };
}


export function addTask(sampleID, parameters, queue, runNow) {
  return function (dispatch) {
    dispatch(addTaskAction(sampleID, parameters));

    if (runNow) {
      const taskIndex = queue[sampleID].tasks.length - 1;
      dispatch(setQueueAndRunTask(sampleID, taskIndex, queue));
    }
  };
}


export function addSampleAndTask(sampleID, parameters, queue, runNow) {
  return function (dispatch) {
    dispatch(addSample(sampleID));
    dispatch(addTask(sampleID, parameters));

    if (runNow) {
      const taskIndex = queue[sampleID].tasks.length - 1;
      dispatch(setQueueAndRunTask(sampleID, taskIndex, queue));
    }
  };
}


export function updateTaskAction(taskData, sampleID, parameters) {
  return { type: 'UPDATE_TASK',
           sampleID,
           taskData,
           parameters
         };
}


export function updateTask(taskData, sampleID, params, queue, runNow) {
  return function (dispatch) {
    dispatch(updateTaskAction(taskData, sampleID, params));

    if (runNow) {
      const taskIndex = queue.indexOf(taskData);
      dispatch(setQueueAndRunTask(sampleID, taskIndex, queue));
    }
  };
}


export function removeTaskAction(task) {
  return { type: 'REMOVE_TASK', task };
}


export function deleteTask(task) {
  return function (dispatch) {
    dispatch(removeTaskAction(task));
  };
}


export function addTaskResultAction(sampleID, taskIndex, state) {
  return { type: 'ADD_TASK_RESULT', sampleID, taskIndex, state };
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
        dispatch(unmountSample(queueID));
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
