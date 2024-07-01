import api from '.';

const endpoint = api.url('/ra');

export function fetchRemoteAccessSettings() {
  return endpoint.get('/').json();
}
