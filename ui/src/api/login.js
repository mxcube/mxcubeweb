import api from '.';

const endpoint = api.url('/login');

export function logIn(proposal, password, previousUser) {
  return endpoint.post({ proposal, password, previousUser }, '/').json();
}

export function signOut() {
  return endpoint.headers({ Accept: '*/*' }).get('/signout').res();
}

export function fetchLoginInfo() {
  return endpoint.get('/login_info').json();
}

export function sendFeedback(sender, content) {
  return endpoint.post({ sender, content }, '/send_feedback').res();
}

export function refreshSession() {
  return endpoint.get('/refresh_session').res();
}
