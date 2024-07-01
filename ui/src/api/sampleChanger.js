import api from '.';

const endpoint = api.url('/sample_changer');

export function fetchSampleChangerInitialState() {
  return endpoint.get('/get_initial_state').json();
}
