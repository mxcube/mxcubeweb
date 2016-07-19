import fetch from 'isomorphic-fetch';

export function addSample(sampleID, queueID) {
  return {
    type: 'ADD_SAMPLE', sampleID, queueID
  };
}

export function removeSample(queueID, sampleID) {
  return {
    type: 'REMOVE_SAMPLE', queueID, sampleID
  };
}

export function clearAll() {
  return {
    type: 'CLEAR_ALL'
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

// export function synchState(savedQueue) {
//   if (Object.keys(savedQueue).length > 0) {
//     savedQueue.current = {};
//     savedQueue.todo = { nodes:[] };
//     savedQueue.history = { nodes:[] };
//     return showRestoreDialog(savedQueue);
//   } else {
//     return showRestoreDialog(savedQueue, false);
//   }
// }

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

export function sendAddSample(SampleId) {
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
      dispatch(addSample(json.SampleId, json.QueueId));
      return json.QueueId; // dispatch(sendState());
    });
  };
}


export function sendDeleteSample(queueID, sampleID) {
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
        dispatch(removeSample(queueID, sampleID));
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
