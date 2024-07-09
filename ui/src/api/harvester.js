import api from '.';

const endpoint = api.url('/harvester');

export function fetchHarvesterInitialState() {
  return endpoint.get('/get_harvester_initial_state').json();
}

export function sendRefresh() {
  return endpoint.get('/contents').json();
}

export function sendHarvestCrystal(xtalUUID) {
  return endpoint.post(JSON.stringify(xtalUUID), '/harvest').json();
}

export function sendHarvestAndLoadCrystal(xtalUUID) {
  return endpoint.post(JSON.stringify(xtalUUID), '/harvest_and_mount').json();
}

export function sendCalibratePin() {
  return endpoint.get('/calibrate').json();
}

export function sendDataCollectionToCrims() {
  return endpoint.get('/send_data_collection_info_to_crims').json();
}

export function sendValidateCalibration(validated) {
  return endpoint
    .post(JSON.stringify(validated), '/validate_calibration')
    .json();
}

export function sendAbort() {
  return endpoint.get('/send_command/abort').res();
}

export function sendCommand(cmdparts, args) {
  return endpoint.get(`/send_command/${cmdparts}/${args}`).json();
}
