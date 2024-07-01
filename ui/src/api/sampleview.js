import api from '.';

const endpoint = api.url('/sampleview');

export function fetchImageData() {
  return endpoint.get('/camera').json();
}

export function fetchShapes() {
  return endpoint.get('/shapes').json();
}
