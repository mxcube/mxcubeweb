import fetch from 'isomorphic-fetch'
import { doUpdateSamples } from './samples_grid'

export function addSample(sample_id, queue_id) {
	return { 
		type: "ADD_SAMPLE", 
		sample_id: sample_id,
		queue_id: queue_id
	}
}

export function removeSample(queue_id, sample_id) {
	return { 
		type: "REMOVE_SAMPLE", 
		queue_id: queue_id,
		index: sample_id
	}
}

export function clearAll() {
        return {
               type: "CLEAR_QUEUE"
        }
}


export function collapseList(listName) {
        return {
               type: "COLLAPSE_LIST",
               list_name: listName
        }
}

export function setState(queueState, sampleGridState) {
        return {
               type: "QUEUE_STATE",
               queueState: queueState,
               sampleGridState: sampleGridState
        }
}

export function changeOrder(listName, oldIndex, newIndex) {
	return { 
		type: "CHANGE_QUEUE_ORDER", 
		listName: listName,
		oldIndex: oldIndex,
		newIndex: newIndex
	}
}

export function changeTaskOrder(sampleId, oldIndex, newIndex) {
	return { 
		type: "CHANGE_METHOD_ORDER", 
		sampleId: sampleId,
		oldIndex: oldIndex,
		newIndex: newIndex
	}
}

export function runSample(queue_id) {
	return { 
		type: "RUN_SAMPLE", 
		queue_id: queue_id
	}
}

export function mountSample(queue_id) {
	return { 
		type: "MOUNT_SAMPLE", 
		queue_id: queue_id
	}
}

export function toggleChecked(queue_id) {
	return { 
		type: "TOGGLE_CHECKED", 
		queue_id: queue_id
	}
}

export function getState() {
	return function(dispatch) {
		fetch('mxcube/api/v0.1/queue/state', { 
			method: 'GET', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}
		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused send state");
			}
			return response.json();
		})
		.then(function(json) {
			if(Object.keys(json.queueState).length !==0 ){
				dispatch(setState(json.queueState, json.sampleGridState));
			}
		});

	}
}

export function sendRunQueue() {
	return function() {

		fetch('mxcube/api/v0.1/queue/start', { 
			method: 'PUT', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}
		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to start queue");
			}
		})
		.then(function() {
			//dispatch(setQueueState("started"));
		});

	}
}

export function sendPauseQueue() {
	return function() {

		fetch('mxcube/api/v0.1/queue/pause', { 
			method: 'PUT', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}
		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to pause queue");
			}
		})
		.then(function() {
			//dispatch(setQueueState("paused"));
		});

	}
}

export function sendStopQueue() {
	return function() {

		fetch('mxcube/api/v0.1/queue/stop', { 
			method: 'PUT', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}
		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to stop queue");
			}
		})
		.then(function() {
			//dispatch(setQueueState("stopped"));
		});

	}
}

export function sendClearQueue() {
	return function(dispatch) {

		fetch('mxcube/api/v0.1/queue/clear', { 
			method: 'PUT', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}
		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to clear queue");
			}
		})
		.then(function() {
			dispatch(clearAll());
			dispatch(doUpdateSamples({}));
		});

	}
}

export function sendAddSample(id) {
	return function(dispatch) {
		return fetch('mxcube/api/v0.1/queue', { 
			method: 'POST', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			},
			body: JSON.stringify({ SampleId : id})
		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to add sample to queue");
			}
			return response.json();
		}).then(function(json) {
                        dispatch(addSample(json.SampleId, json.QueueId));
                        return json.QueueId //dispatch(sendState());
		})
	}
}


export function sendDeleteSample(queue_id, sample_id) {
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
				dispatch(removeSample(queue_id, sample_id));
			}
		});

	}
}

export function sendMountSample(queue_id) {
	return function(dispatch) {

		fetch('mxcube/api/v0.1/sample_changer/' + queue_id + "/mount", { 
			method: 'PUT', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}

		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to mount sample");
			}else {
				dispatch(mountSample(queue_id));
			}
		});

	}
}

export function sendRunSample(queue_id) {
	return function(dispatch) {

		fetch('mxcube/api/v0.1/queue/' + queue_id + "/execute", { 
			method: 'PUT', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}

		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to run sample");
			}else {
				dispatch(runSample(queue_id));
			}
		});

	}
}


export function sendToggleCheckBox(queue_id) {
	return function(dispatch) {

		fetch('mxcube/api/v0.1/queue/' + queue_id + "/toggle", { 
			method: 'PUT', 
                        credentials: 'include',
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}

		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to toogle checked task");
			}else {
				dispatch(toggleChecked(queue_id));

			}
		});

	}
}


