import api from '.';

const endpoint = api.url('/sample_changer');

export function fetchSampleChangerInitialState() {
  return endpoint.get('/get_initial_state').json();
}

export function fetchSampleChangerContents() {
  return endpoint.get('/contents').json();
}

export function fetchLoadedSample() {
  return endpoint.get('/loaded_sample').json();
}

export function fetchSamplesList() {
  return endpoint.get('/samples_list').json();
}

export function sendSelectContainer(address) {
  return endpoint.get(`/select/${address}`).json();
}

export function sendScanSampleChanger(address) {
  return endpoint.get(`/scan/${address}`).json();
}

export function sendMountSample(sampleData) {
  return endpoint.post(sampleData, '/mount').res();
}

export function sendUnmountSample(sample) {
  return endpoint.post({ sample: { location: sample } }, '/unmount').res();
}

export function sendUnmountCurrentSample() {
  return endpoint.post(undefined, '/unmount_current').res();
}

export function sendAbortSampleChanger() {
  return endpoint.get('/send_command/abort').res();
}

export function sendSampleChangerCommand(cmdparts, args) {
  return endpoint.get(`/send_command/${cmdparts}/${args}`).res();
}

export function sendSyncWithCrims() {
  return endpoint.get('/sync_with_crims').json();
}
