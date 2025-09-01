import api from './api';

const endpoint = api.url('/log');

export function fetchLogMessages() {
  return endpoint.get('/').safeJson();
}

export function sendLogFrontEndTraceBack(stack, state) {
  const { logger, ...stateToLog } = state;
  const trace = { stack, state: stateToLog };

  return endpoint.post({ trace }, '/log_frontend_traceback').res();
}
