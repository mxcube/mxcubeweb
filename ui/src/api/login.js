import api from './api';

const endpoint = api.url('/login');

export function sendSignOut() {
  return endpoint.headers({ Accept: '*/*' }).get('/signout').res();
}

export function sendFeedback(sender, content) {
  return endpoint.post({ sender, content }, '/send_feedback').res();
}

export function sendRefreshSession() {
  return endpoint.get('/refresh_session').res();
}
