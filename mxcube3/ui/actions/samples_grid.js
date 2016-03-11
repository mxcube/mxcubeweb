import fetch from 'isomorphic-fetch'
import { sendClearQueue, sendRunSample, sendAddSample } from './queue'
import { showForm } from './methodForm'

export function doUpdateSamples(samples_list) {
    return { type: "UPDATE_SAMPLES", samples_list }
}

export function doGetSamplesList() {
   return function(dispatch) {
       window.please_wait_dialog.show();
       fetch('mxcube/api/v0.1/sample_changer/samples_list', {credentials: 'include'})
            .then(response => response.json())
            .then(json => {
                window.please_wait_dialog.hide();
                dispatch(doUpdateSamples(json));
            }, () => { 
                window.please_wait_dialog.hide();
                window.error_notification.notify("Could not get samples list");
            })
    }
}

export function doSetLoadable(loadable) {
    return { type: "SET_LOADABLE", loadable }
}

export function doAddTag(tag) {
    return { type: "ADD_TAG", tag }
}

export function doToggleSelected(index) {
    return { type: "TOGGLE_SELECTED", index }
}

export function setClickedTask(task) {
    return { type: "CLICKED_TASK", task }
}

export function doSelectAll() {
    let selected = true;
    return { type: "SELECT_ALL", selected }
}

export function doUnselectAll() {
    let selected = false;
    return { type: "UNSELECT_ALL", selected }
}

export function doFilter(filter_text) {
    return { type: "FILTER",  filter_text }
}

export function doSetSamplesInfo(sample_info_list) {
    return { type: "SET_SAMPLES_INFO", sample_info_list }
}

export function doSyncSamples(proposal_id) {
    return function(dispatch) {
        fetch("mxcube/api/v0.1/samples/"+proposal_id, {credentials: 'include'})
            .then(response => response.json())
            .then(json => {
                dispatch(doSetSamplesInfo(json.samples_info));
            })
    }
}

export function doAddTask(sample_queue_id, sample_id, method, parameters) {
    return { type: "ADD_METHOD",
            method_type: method.Type,  
            index: sample_id,
            parent_id: sample_queue_id,
            queue_id: method.QueueId,
            parameters: parameters
           }
}

export function doAddTaskResult(sample_id, method_queue_id, state) {
    return { type: "ADD_METHOD_RESULTS",
            index: sample_id,
            queue_id: method_queue_id,
            state: state
            }
}

export function doToggleManualMount() {
    return function(dispatch, getState) {
        const { samples_grid } = getState();
        if (samples_grid.manual_mount) {
            dispatch(doSetManualMount(false));
            dispatch(doGetSamplesList());
        } else {
            dispatch(doSetManualMount(true));
            dispatch(sendClearQueue());
            dispatch(doUpdateSamples([{id:"0", sample_info: { sampleName: "mounted sample"}}])); 
        }
    }
}
            
export function doSetManualMount(manual) {
    return { type: "SET_MANUAL_MOUNT", manual }
}


export function doChangeTask(queue_id, sample_id, parameters) {
    return { type: "CHANGE_METHOD",
            index: sample_id,
            queue_id: queue_id,
            parameters: parameters
    }
}

export function doRemoveMethod(sample_queue_id, queue_id, sample_id) {
    return { type: "REMOVE_METHOD",
            index: sample_id,
            parent_id: sample_queue_id,
            queue_id: queue_id  
            }
}


export function showTaskParametersForm(task_name, clicked_task) {
    return function(dispatch) {
        dispatch(setClickedTask(clicked_task || Object()));
        dispatch(showForm(task_name));
    }
}

export function sendAddSampleTask(queue_id, sample_id, parameters, runNow) {
    return function(dispatch) {
        fetch('mxcube/api/v0.1/queue/' + queue_id, { 
            method: 'POST', 
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify(parameters)
        }).then((response) => {
            if (response.status >= 400) {
                throw new Error("Could not add sample method, server refused");
            }
            return response.json();
        }).then(function(json) {
            if(runNow){
                dispatch(sendRunSample(json.QueueId));
            }
            dispatch(doAddTask(queue_id, sample_id, json, parameters));
        });
    }
}

export function sendAddSampleAndTask(sample_id, parameters) {
    return function(dispatch) {
        dispatch(sendAddSample(sample_id)).then(
            queue_id => {
                dispatch(sendAddSampleTask(queue_id, sample_id, parameters));
            })
    }
}

export function sendChangeSampleTask(sample_queue_id, method_queue_id, sample_id, parameters, runNow) {
        return function(dispatch) {

        fetch('mxcube/api/v0.1/queue/' + queue_id + '/' + parent_id, { 
            method: 'PUT', 
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify(parameters)
        }).then((response) => {
            if (response.status >= 400) {
                throw new Error("Could not change sample method, server refused");
            }
            return response.json();
        }).then(function() {
            if(runNow){
                dispatch(sendRunSample(method_queue_id));
            }
            dispatch(doChangeTask(method_queue_id, sample_id, parameters));
        });
    }
}


export function sendDeleteSampleTask(parent_id, queue_id, sample_id) {
    return function(dispatch) {
        fetch('mxcube/api/v0.1/queue/' + queue_id, { 
            method: 'DELETE', 
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            }

        }).then(function(response) {
            if (response.status >= 400) {
                throw new Error("Server refused to remove sample");
            }else {
                dispatch(doRemoveTask(parent_id, queue_id, sample_id));
            }
        });
    }
}
