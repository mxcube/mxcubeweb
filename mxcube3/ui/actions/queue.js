import fetch from 'isomorphic-fetch'


export function selectSample(queue_id, sample_id) {
	return { 
		type: "SELECT_SAMPLE", 
		queue_id: queue_id,
		sample_id: sample_id
	}
}

export function addSample(sample_id, queue_id) {
	return { 
		type: "ADD_SAMPLE", 
		sample_id: sample_id,
		queue_id: queue_id
	}
}

export function removeSample(index) {
	console.log("removing sample");
	return { 
		type: "REMOVE_SAMPLE", 
		index: index
	}
}


export function sendAddSample(id) {
	return function(dispatch) {

		fetch('mxcube/api/v0.1/queue/add/' + id, { 
			method: 'POST', 
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}

		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to add sample to queue");
			}
			return response.json();
		})
		.then(function(json) {
			dispatch(addSample(json.SampleId, json.QueueId));
		});

	}
}


export function sendDeleteSample(id, list_index) {
	return function(dispatch) {

		fetch('mxcube/api/v0.1/queue/' + id, { 
			method: 'DELETE', 
			headers: {
				'Accept': 'application/json',
				'Content-type': 'application/json'
			}

		}).then(function(response) {
			if (response.status >= 400) {
				throw new Error("Server refused to remove sample");
			}else {
				dispatch(removeSample(list_index));
			}
		});

	}
}