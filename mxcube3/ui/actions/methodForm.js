export function showForm(formName, sample_queue_id, methodData={}, point_queue_id=-1) {
	return { 
		type: "SHOW_FORM", 
		name: formName,
		sample_ids: sample_queue_id,
		methodData: methodData,
		point_id: point_queue_id
	}
}

export function hideTaskParametersForm() {
	return { 
		type: "HIDE_FORM" 
	}
}

