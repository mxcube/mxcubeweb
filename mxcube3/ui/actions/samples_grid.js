import fetch from 'isomorphic-fetch'

export function doUpdateSamples(samples_list) {
    return { type: "UPDATE_SAMPLES", samples_list }
}

export function doGetSamplesList() {
   return function(dispatch) {
       window.please_wait_dialog.show();
       fetch('mxcube/api/v0.1/sample_changer/samples_list')
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

export function doSelectAll() {
    return { type: "SELECT_ALL" }
}

export function doFilter(filter_text) {
    return { type: "FILTER",  filter_text }
}

export function doSetSamplesInfo(sample_info_list) {
    return { type: "SET_SAMPLES_INFO", sample_info_list }
}

export function doSyncSamples(proposal_id) {
    return function(dispatch) {
        fetch("mxcube/api/v0.1/samples/"+proposal_id)
            .then(response => response.json())
            .then(json => {
                dispatch(doSetSamplesInfo(json.samples_info));
            })
    }
}

export function doAddMethod(sample_id, method, parameters) {
    return { type: "ADD_METHOD",
            name: method.Name,  
            index: sample_id,
            queue_id: method.QueueId,
            parameters: parameters
              }
}

export function doRemoveMethod(sample_id, list_id) {
    return { type: "REMOVE_METHOD",
            index: sample_id,  
            list_index: list_id,
              }
}


export function sendAddSampleMethod(queue_id, sample_id, method) {
    console.log("called");
    return function(dispatch) {

        fetch('mxcube/api/v0.1/queue/' + queue_id + '/addmethod/' + method.name, { 
            method: 'POST', 
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ method })
        }).then((response) => {
            if (response.status >= 400) {
                throw new Error("Could not add sample method, server refused");
            }
            return response.json();
        }).then(function(json) {
            dispatch(doAddMethod(sample_id, json, method));
        });
       

    }
}


export function sendDeleteSampleMethod(queue_id, sample_id, list_id) {

    return function(dispatch) {

        fetch('mxcube/api/v0.1/queue/' + queue_id, { 
            method: 'DELETE', 
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            }

        }).then(function(response) {
            if (response.status >= 400) {
                throw new Error("Server refused to remove sample");
            }else {
                dispatch(doRemoveMethod(sample_id, list_id));
            }
        });

    }
}
