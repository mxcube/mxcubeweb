export function showForm(formName, point = false) {
	return { 
		type: "SHOW_FORM", 
		name: formName,
		point: point
	}
}

export function hideForm(formName) {
	return { 
		type: "HIDE_FORM", 
		name: formName,
	}
}

