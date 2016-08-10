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

export function collapseSample(queueID) {
  return {
    type: 'COLLAPSE_SAMPLE', queueID
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


export function addSample(sampleId, sampleData) {
  return function (dispatch) {
    dispatch(addSampleAction(sampleId, sampleData));

    // Its perhaps possible to not even sendMountSample at this point,
    // does it even make sense ?
    dispatch(sendMountSample(sampleId));
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


export function addTaskAction(sampleID, parameters) {
  return { type: 'ADD_TASK',
           sampleID,
           parameters
  };
}


export function addTask(sampleID, parameters, runNow) {
  return function (dispatch) {
    if (runNow) {
      dispatch(sendRunSample(sampleID));
    }

    dispatch(addTaskAction(sampleID, parameters));
  };
}


export function addSampleAndTask(sampleID, parameters) {
  return function (dispatch) {
    dispatch(addSample(sampleID));
    dispatch(addTask(sampleID, parameters));
  };
}


export function updateTaskAction(taskData, sampleID, parameters) {
  return { type: 'UPDATE_TASK',
           sampleID,
           taskData,
           parameters
         };
}


export function updateSampleTask(taskData, sampleID, params, runNow) {
  return function (dispatch) {
    if (runNow) {
      dispatch(sendRunSample(taskData.queueID));
    }

    dispatch(updateTaskAction(taskData, sampleID, params));
  };
}


export function removeTaskAction(task) {
  return { type: 'REMOVE_TASK', task };
}


export function deleteSampleTask(task) {
  return function (dispatch) {
    dispatch(removeTaskAction(task));
  };
}


export function addTaskResultAction(sampleID, taskQueueID, state) {
  return { type: 'ADD_TASK_RESLT',
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
