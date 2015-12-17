export function showForm(formName) {
	return { 
		type: "SHOW_FORM", 
		name: formName,
	}
}

export function hideForm(formName) {
	return { 
		type: "HIDE_FORM", 
		name: formName,
	}
}

