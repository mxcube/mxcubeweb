import api from '.';

const endpoint = api.url('/harvester');

export function sendRefresh() {
  return endpoint.get('/contents').res();
}

export function sendHarvestCrystal(xtalUUID) {
  return endpoint.post(JSON.stringify(xtalUUID), '/harvest').res();
}

export function sendHarvestAndLoadCrystal(xtalUUID) {
  return endpoint.post(JSON.stringify(xtalUUID), '/harvest_and_mount').res();
}

export function sendCalibratePin() {
  return endpoint.get('/calibrate').res();
}

export function sendDataCollectionToCrims() {
  return endpoint.get('/send_data_collection_info_to_crims').res();
}

export function sendValidateCalibration(validated) {
  return endpoint
    .post(JSON.stringify(validated), '/validate_calibration')
    .res();
}

export function sendAbort() {
  return endpoint.get('/send_command/abort').res();
}

export function sendCommand(cmdparts, args) {
  return endpoint.get(`/send_command/${cmdparts}/${args}`).res();
}
