import api from './api';

const endpoint = api.url('/beamline');

export function fetchBeamlineSetup() {
  return endpoint.get('/').safeJson();
}

export function fetchBeamInfo() {
  return endpoint.get('/beam/info').safeJson();
}

export function sendPrepareBeamlineForNewSample() {
  return endpoint.put(undefined, '/prepare_beamline').res();
}

export function sendRunBeamlineAction(name, parameters) {
  return endpoint.post({ parameters }, `/${name}/run`).res();
}

export function sendAbortBeamlineAction(name) {
  return endpoint.get(`/${name}/abort`).res();
}
