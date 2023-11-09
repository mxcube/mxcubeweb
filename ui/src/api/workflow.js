import api from '.';

const endpoint = api.url('/workflow');

export function fetchAvailableWorkflows() {
  return endpoint.get('/').json();
}

export function sendSubmitWorkflowParameters(data) {
  return endpoint.post(data, '/').res();
}
