import api from '.';

const endpoint = api.url('/diffractometer');

export function fetchDiffractometerInfo() {
  return endpoint.get('/info').json();
}

export function fetchMotorPositions() {
  return endpoint.get('/movables/state').json();
}

export function sendUpdateCurrentPhase(phase) {
  return endpoint.put({ phase }, '/phase').res();
}

export function sendUpdateAperture(diameter) {
  return endpoint.put({ diameter }, '/aperture').res();
}
