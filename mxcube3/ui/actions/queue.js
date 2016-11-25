import fetch from 'isomorphic-fetch';
import { setLoading, showErrorPanel } from './general';
import { showTaskForm } from './taskForm';
import { sendAbortCentring } from './sampleview';

export function setSampleListAction(sampleList) {
  return { type: 'SET_SAMPLE_LIST', sampleList };
}


export function sendGetSampleList() {
  return function (dispatch) {
    dispatch(setLoading(true, 'Please wait', 'Retrieving sample changer contents', true));
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
        dispatch(setSampleListAction({}));
        dispatch(setManualMountAction(manual));
        if (manual) {
          dispatch(showTaskForm('AddSample'));
        }
      }
    });
  };
}


export function setSamplesInfoAction(sampleInfoList) {
  return { type: 'SET_SAMPLES_INFO', sampleInfoList };
}


export function sendSyncSamples(proposalId) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/lims/samples/${proposalId}`, { credentials: 'include' })
            .then(response => response.json())
            .then(json => {
              dispatch(setSamplesInfoAction(json.samples_info));
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


export function showList(listName) {
  return {
    type: 'SHOW_LIST',
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


export function setQueueAction(queue) {
  return { type: 'SET_QUEUE', queue };
}


export function sendSetQueue(queue, sampleOrder) {
  const itemList = [];

  for (const key of sampleOrder) {
    itemList.push(queue[key]);
  }

  return fetch('mxcube/api/v0.1/queue', {
    method: 'PUT',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify(itemList)
  });
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


export function setQueueAndRun(queue, sampleOrder) {
  return function (dispatch) {
    sendSetQueue(queue, sampleOrder).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to set queue');
      } else {
        dispatch(setCurrentSample(sampleOrder[0]));
        dispatch(sendRunQueue());
      }
    });
  };
}


export function setQueueAndRunTask(sampleID, taskIndex) {
  return function (dispatch, getState) {
    const { queue } = getState();
    let ti = taskIndex;

    if (ti === undefined) {
      ti = queue.queue[sampleID].tasks.length;
    }

    sendSetQueue(queue.queue, queue.sampleOrder).then(() => {
      dispatch(sendRunSample(sampleID, taskIndex));
    });
  };
}


export function removeTaskAction(sampleID, taskIndex) {
  return { type: 'REMOVE_TASK', sampleID, taskIndex };
}


export function deleteTask(sampleID, taskIndex) {
  return function (dispatch) {
    dispatch(removeTaskAction(sampleID, taskIndex));
  };
}


export function addTaskAction(task) {
  return { type: 'ADD_TASK', task };
}


export function updateTaskAction(sampleID, taskIndex, params) {
  return { type: 'UPDATE_TASK', sampleID, taskIndex, params };
}


export function updateTask(sampleID, taskIndex, params, runNow) {
  return function (dispatch) {
    dispatch(updateTaskAction(sampleID, taskIndex, params));

    if (runNow) {
      dispatch(setQueueAndRunTask(sampleID, taskIndex));
    }
  };
}


export function addTask(sampleIDList, parameters, runNow) {
  return function (dispatch, getState) {
    const { queue } = getState();

    for (const sampleID of sampleIDList) {
      if (!queue.queue[sampleID]) {
        dispatch(addSample(queue.sampleList[sampleID]));
      }

      const task = { type: parameters.type,
                     label: parameters.label,
                     sampleID,
                     parameters,
                     checked: true };

      dispatch(addTaskAction(task));
    }

    if (sampleIDList.length === 1 && runNow) {
      dispatch(setQueueAndRunTask(sampleIDList[0]));
    }
  };
}


export function addTaskResultAction(sampleID, taskIndex, state, progress, limsResultData) {
  return { type: 'ADD_TASK_RESULT', sampleID, taskIndex, state, progress, limsResultData };
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


export function setunNow(run, sampleID, taskIndex) {
  return { type: 'SET_RUN_NOW', run, sampleID, taskIndex };
}


export function addSampleManualMount(sampleData) {
  return function (dispatch) {
    dispatch(clearQueue());
    dispatch(appendSampleList(sampleData));
    dispatch(addSample(sampleData));
    dispatch(setCurrentSample(sampleData.sampleID));
  };
}
