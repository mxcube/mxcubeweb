import api from './api';

const endpoint = api.url('/sampleview');

export function fetchImageData() {
  return endpoint.get('/camera').safeJson();
}

export function sendSetVideoSize(width, height) {
  return endpoint.post({ width, height }, '/camera').safeJson();
}

export function fetchShapes() {
  return endpoint.get('/shapes').safeJson();
}

export function sendAddOrUpdateShapes(shapes) {
  return endpoint.post({ shapes }, '/shapes').safeJson();
}

export function sendDeleteShape(id) {
  return endpoint.delete(`/shapes/${id}`).res();
}

export function sendRotateToShape(sid) {
  return endpoint.post({ sid }, '/shapes/rotate_to').res();
}

export function sendSetCentringMethod(centringMethod) {
  return endpoint.put({ centringMethod }, '/centring/centring_method').res();
}

export function sendStartClickCentring() {
  return endpoint.put(undefined, '/centring/start_click_centring').safeJson();
}

export function sendRecordCentringClick(x, y) {
  return endpoint.put({ clickPos: { x, y } }, '/centring/click').safeJson();
}

export function sendAcceptCentring() {
  return endpoint.put(undefined, '/centring/accept').res();
}

export function sendAbortCentring() {
  return endpoint.put(undefined, '/centring/abort').res();
}

export function sendMoveToPoint(id) {
  return endpoint.put(undefined, `/centring/${id}/moveto`).res();
}

export function sendMoveToBeam(x, y) {
  return endpoint.put({ clickPos: { x, y } }, '/movetobeam').res();
}

export function sendTakeSnapshot(canvasData) {
  return endpoint.post({ overlay: canvasData }, '/camera/snapshot').blob();
}
