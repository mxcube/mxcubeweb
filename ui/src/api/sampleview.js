import api from '.';

const endpoint = api.url('/sampleview');

export function fetchImageData() {
  return endpoint.get('/camera').json();
}

export function sendSetVideoSize(width, height) {
  return endpoint.post({ width, height }, '/camera').json();
}

export function fetchShapes() {
  return endpoint.get('/shapes').json();
}

export function sendAddOrUpdateShapes(shapes) {
  return endpoint.post({ shapes }, '/shapes').json();
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
  return endpoint.put(undefined, '/centring/start3click').json();
}

export function sendRecordCentringClick(x, y) {
  return endpoint.put({ clickPos: { x, y } }, '/centring/click').json();
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

export function sendUpdateMotorPosition(motorName, value) {
  return endpoint.put(undefined, `/${motorName}/${value}`).res();
}
