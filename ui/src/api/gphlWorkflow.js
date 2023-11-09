import api from '.';

const endpoint = api.url('/gphl_workflow');

export function fetchAvailableGphlWorkflows() {
  return endpoint.get('/').json();
}

export function sendSubmitGphlWorkflowParameters(data) {
  return endpoint.post(data, '/').res();
}
