import fetch from 'isomorphic-fetch';
import { sendClearQueue, sendRunSample, sendAddSample, sendMountSample } from './queue';
import { showTaskForm } from './taskForm';
import { setLoading, showErrorPanel } from './general';


export function updateSampleListAction(sampleList) {
  return { type: 'UPDATE_SAMPLE_LIST', sampleList };
}


export function sendGetSampleListRequest() {
  return function (dispatch) {
    dispatch(setLoading(true));
    fetch('mxcube/api/v0.1/sample_changer/samples_list', { credentials: 'include' })
            .then(response => response.json())
            .then(json => {
              dispatch(setLoading(false));
              dispatch(updateSampleListAction(json));
            }, () => {
              dispatch(setLoading(false));
              dispatch(showErrorPanel(true, 'Could not get samples list'));
            });
  };
}


export function addSampleToGridAction(id, parameters) {
  return { type: 'ADD_SAMPLE_TO_GRID', id, data: parameters };
}


export function addSample(id, parameters) {
  return function (dispatch) {
    dispatch(sendAddSample(id)).then(
      queueID => {
        dispatch(sendMountSample(queueID));
      }
    );
    dispatch(addSampleToGridAction(id, parameters));
  };
}


export function pickAllAction(picked) {
  return { type: 'PICK_ALL_SAMPLES', picked };
}


export function selectAction(indices) {
  return { type: 'SELECT_SAMPLES', indices };
}


export function filterAction(filterText) {
  return { type: 'FILTER_SAMPLE_LIST', filterText };
}


export function setSamplesInfoAction(sampleInfoList) {
  return { type: 'SET_SAMPLES_INFO', sampleInfoList };
}


export function sendSyncSamplesRequest(proposalId) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/samples/${proposalId}`, { credentials: 'include' })
            .then(response => response.json())
            .then(json => {
              dispatch(setSamplesInfoAction(json.samples_info));
            });
  };
}


export function addTaskAction(sampleQueueID, sampleID, task, parameters) {
  return { type: 'ADD_TASK',
           taskType: task.Type,
           index: sampleID,
           parentID: sampleQueueID,
           queueID: task.QueueId,
           parameters
         };
}


export function addTaskResultAction(sampleID, taskQueueID, state) {
  return { type: 'ADD_TASK_RESULT',
            index: sampleID,
            queueID: taskQueueID,
            state
         };
}


export function setManualMountAction(manual) {
  return { type: 'SET_MANUAL_MOUNT', manual };
}


export function sendManualMountRequest(manual) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/diffractometer/usesc', {
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
        dispatch(setManualMountAction(manual));
        if (manual) {
          dispatch(showTaskForm('AddSample'));
        }
      }
    });
  };
}


export function updateTaskAction(queueID, sampleID, parameters) {
  return { type: 'UPDATE_TASK',
           index: sampleID,
           queueID,
           parameters
         };
}


export function removeTaskAction(sampleQueueID, queueID, sampleID) {
  return { type: 'REMOVE_TASK',
           index: sampleID,
           parentID: sampleQueueID,
           queueID
         };
}


export function sendAddSampleTaskRequest(queueID, sampleID, parameters, runNow) {
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


export function sendAddSampleAndTaskRequest(sampleID, parameters) {
  return function (dispatch) {
    dispatch(sendAddSample(sampleID)).then(
            queueID => {
              dispatch(sendAddSampleTaskRequest(queueID, sampleID, parameters));
            });
  };
}


export function sendUpdateSampleTaskRequest(taskQueueID, sampleQueueID, sampleID, params, runNow) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/queue/${sampleQueueID}/${taskQueueID}`, {
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
        dispatch(sendRunSample(taskQueueID));
      }
      dispatch(updateTaskAction(taskQueueID, sampleID, params));
    });
  };
}


export function sendDeleteSampleTask(parentID, queueID, sampleID) {
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
        dispatch(removeTaskAction(parentID, queueID, sampleID));
      }
    });
  };
}


export function setSampleOrderAction(newSampleOrder) {
  return { type: 'SET_SAMPLE_ORDER', order: newSampleOrder };
}


export function toggleMovableAction(key) {
  return { type: 'TOGGLE_MOVABLE_SAMPLE', key };
}


export function pickSelectedAction() {
  return { type: 'PICK_SELECTED_SAMPLES' };
}
