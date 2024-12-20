import api from './api';

const endpoint = api.url('/detector');

export function fetchDetectorInfo() {
  return endpoint.get('/').safeJson();
}

export function fetchDisplayImage(path, imgNum) {
  return endpoint
    .get(`/display_image?path=${path}&img_num=${imgNum}`)
    .safeJson();
}
