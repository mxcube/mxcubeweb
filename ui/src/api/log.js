import api from '.';

const endpoint = api.url('/log');

export function fetchLogMessages() {
  return endpoint.get('/').json();
}

export function sendLogFrontEndTraceBack(stack, state) {
  const { logger, ...stateToLog } = state;
  const body = { stack, state: stateToLog };

  return endpoint.post(body, '/log_frontend_traceback').res();
}
