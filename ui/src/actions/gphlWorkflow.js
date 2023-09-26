import fetch from 'isomorphic-fetch';

export function showGphlWorkflowParametersDialog(formData, show = true) {
  return { type: 'SHOW_GPHL_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}

export function gphlWorkflowSubmitParameters(data) {
  return function () {
    fetch('mxcube/api/v0.1/gphl_workflow/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  };
}
