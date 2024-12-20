import api from './api';

const endpoint = api.url('/log');

export function fetchLogMessages() {
  return endpoint.get('/').safeJson();
}

export function sendLogFrontEndTraceBack(stack, state) {
  const { logger, ...stateToLog } = state;
  const body = { stack, state: stateToLog };

  return endpoint.post(body, '/log_frontend_traceback').res();
}
