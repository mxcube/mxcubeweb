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
