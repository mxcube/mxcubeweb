import api from './api';

const endpoint = api.url('/diffractometer');

export function fetchDiffractometerInfo() {
  return endpoint.get('/info').safeJson();
}

export function sendUpdateCurrentPhase(phase) {
  return endpoint.put({ phase }, '/phase').res();
}

export function sendUpdateAperture(diameter) {
  return endpoint.put({ diameter }, '/aperture').res();
}
