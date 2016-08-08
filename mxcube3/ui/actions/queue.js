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


export function addSample(sampleID, queueID, sampleData) {
  return {
    type: 'ADD_SAMPLE', sampleID, queueID, sampleData
  };
}

export function removeSample(queueID, sampleID) {
  return {
    type: 'REMOVE_SAMPLE', queueID, sampleID
  };
}


export function setStatus(queueState) {
  return {
    type: 'SET_QUEUE_STATUS', queueState
  };
}


export function collapseList(listName) {
  return {
    type: 'COLLAPSE_LIST',
    list_name: listName
  };
}

export function collapseSample(queueID) {
  return {
    type: 'COLLAPSE_SAMPLE', queueID
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

export function mountSample(queueID) {
  return {
    type: 'MOUNT_SAMPLE', queueID
  };
}

export function unmountSample(queueID) {
  return {
    type: 'UNMOUNT_SAMPLE', queueID
  };
}

export function toggleChecked(queueID) {
  return {
    type: 'TOGGLE_CHECKED', queueID
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


export function sendMountSample(queueID) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/sample_changer/${queueID}/mount`, {
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
        dispatch(mountSample(queueID));
      }
    });
  };
}


export function sendAddSample(SampleId, sampleData) {
  return function (dispatch) {
    return fetch('mxcube/api/v0.1/queue', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ SampleId })
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to add sample to queue');
      }
      return response.json();
    }).then((json) => {
      dispatch(addSample(json.SampleId, json.QueueId, sampleData));
      dispatch(sendMountSample(json.QueueId));
      return json.QueueId; // dispatch(sendState());
    });
  };
}


export function sendDeleteSample(queueID, sampleID) {
  return function (dispatch) {
    return fetch(`mxcube/api/v0.1/queue/${queueID}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to remove sample');
      } else {
        dispatch(removeSample(queueID, sampleID));
      }
    });
  };
}


export function sendRunSample(queueID) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${queueID}/execute`, {
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
        dispatch(runSample(queueID));
      }
    });
  };
}


export function addTaskAction(sampleQueueID, sampleID, task, parameters) {
  return { type: 'ADD_TASK',
           taskType: task.Type,
           sampleID,
           parentID: sampleQueueID,
           queueID: task.QueueId,
           parameters
  };
}


export function sendAddSampleTask(queueID, sampleID, parameters, runNow) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${queueID}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(parameters)
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Could not add sample task, server refused');
      }
      return response.json();
    }).then((json) => {
      if (runNow) {
        dispatch(sendRunSample(json.QueueId));
      }
      dispatch(addTaskAction(queueID, sampleID, json, parameters));
    });
  };
}


export function sendAddSampleAndTask(sampleID, parameters) {
  return function (dispatch) {
    dispatch(sendAddSample(sampleID)).then(
      queueID => {
        dispatch(sendAddSampleTask(queueID, sampleID, parameters));
      });
  };
}


export function updateTaskAction(taskData, sampleID, parameters) {
  return { type: 'UPDATE_TASK',
           sampleID,
           taskData,
           parameters
         };
}


export function sendUpdateSampleTask(taskData, sampleID, sampleQueueID, params, runNow) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${sampleQueueID}/${taskData.queueID}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(params)
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Could not change sample task, server refused');
      }
      return response.json();
    }).then(() => {
      if (runNow) {
        dispatch(sendRunSample(taskData.queueID));
      }
      dispatch(updateTaskAction(taskData, sampleID, params));
    });
  };
}


export function removeTaskAction(task) {
  return { type: 'REMOVE_TASK', task };
}


export function sendDeleteSampleTask(task, queueID) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${queueID}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }

    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to remove sample');
      } else {
        dispatch(removeTaskAction(task));
      }
    });
  };
}


export function addTaskResultAction(sampleID, taskQueueID, state) {
  return { type: 'ADD_TASK_RESULT',
           sampleID,
           taskQueueID,
           state
  };
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


export function sendToggleCheckBox(queueID) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${queueID}/toggle`, {
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
        dispatch(toggleChecked(queueID));
      }
    });
  };
}
