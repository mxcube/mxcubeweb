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
