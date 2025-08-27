import api from './api';

const endpoint = api.url('/hwobj/');

export function fetchDetectorInfo() {
  return endpoint.get('detector/detector/get_detector_info').safeJson();
}

export function fetchDisplayImage(path, imgNum) {
  return endpoint
    .put(
      { image_path: path, image_num: imgNum },
      'detector/detector/display_image',
    )
    .safeJson();
}
