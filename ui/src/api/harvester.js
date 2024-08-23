import api from '.';

const endpoint = api.url('/harvester');

export function fetchHarvesterInitialState() {
  return endpoint.get('/get_harvester_initial_state').safeJson();
}

export function sendRefresh() {
  return endpoint.get('/contents').safeJson();
}

export function sendHarvestCrystal(xtalUUID) {
  return endpoint.post(JSON.stringify(xtalUUID), '/harvest').safeJson();
}

export function sendHarvestAndLoadCrystal(xtalUUID) {
  return endpoint
    .post(JSON.stringify(xtalUUID), '/harvest_and_mount')
    .safeJson();
}

export function sendCalibratePin() {
  return endpoint.get('/calibrate').safeJson();
}

export function sendDataCollectionInfoToCrims() {
  return endpoint.get('/send_data_collection_info_to_crims').safeJson();
}

export function sendValidateCalibration(validated) {
  return endpoint
    .post(JSON.stringify(validated), '/validate_calibration')
    .safeJson();
}

export function sendAbortHarvester() {
  return endpoint.get('/send_command/abort').res();
}

export function sendHarvesterCommand(cmdparts, args) {
  return endpoint.get(`/send_command/${cmdparts}/${args}`).safeJson();
}
