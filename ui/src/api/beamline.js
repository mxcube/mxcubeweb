import api from '.';

const endpoint = api.url('/beamline');

export function fetchBeamlineSetup() {
  return endpoint.get('/').json();
}

export function fetchBeamInfo() {
  return endpoint.get('/beam/info').json();
}

export function sendPrepareBeamlineForNewSample() {
  return endpoint.put(undefined, '/prepare_beamline').res();
}

export function sendExecuteCommand(obj, name, args) {
  return endpoint.post(args, `/${obj}/command/${name}`).res();
}

export function sendSetAttribute(name, type, value) {
  return endpoint.put({ name, value }, `/${type}/value/${name}`).res();
}

export function sendGetAttribute(type, name, attr, args) {
  return endpoint.post(args, `/${type}/${name}/${attr}`).json();
}

export function sendRunBeamlineAction(name, parameters) {
  return endpoint.post({ parameters }, `/${name}/run`).res();
}

export function sendAbortBeamlineAction(name) {
  return endpoint.get(`/${name}/abort`).res();
}
