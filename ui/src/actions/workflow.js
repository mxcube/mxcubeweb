import fetch from 'isomorphic-fetch';

export function showWorkflowParametersDialog(formData, show = true) {
  return { type: 'SHOW_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}

export function workflowSubmitParameters(data) {
  return function () {
    fetch('mxcube/api/v0.1/workflow/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  };
}
