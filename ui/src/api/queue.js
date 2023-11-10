import api from '.';

const endpoint = api.url('/queue');

export function fetchQueueState() {
  return endpoint.get('/queue_state').json();
}

export function fetchAvailableTasks() {
  return endpoint.get('/available_tasks').json();
}

export function sendClearQueue() {
  return endpoint.put(undefined, '/clear').res();
}

export function sendStartQueue(autoMountNext, sid) {
  return endpoint.put({ autoMountNext, sid }, '/start').res();
}

export function sendPauseQueue() {
  return endpoint.put(undefined, '/pause').res();
}

export function sendResumeQueue() {
  return endpoint.put(undefined, '/unpause').res();
}

export function sendStopQueue() {
  return endpoint.put(undefined, '/stop').res();
}
