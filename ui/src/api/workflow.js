import api from './api';

const endpoint = api.url('/workflow');

export function fetchAvailableWorkflows() {
  return endpoint.get('/').safeJson();
}

export function sendSubmitWorkflowParameters(data) {
  return endpoint.post(data, '/').res();
}

export function sendUpdatedGphlWorkflowParameters(data) {
  return endpoint.post(data, '/gphl').res();
}
