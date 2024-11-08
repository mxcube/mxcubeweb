import api from '.';

const endpoint = api.url('/login');

export function sendLogIn(proposal, password, previousUser) {
  return endpoint.post({ proposal, password, previousUser }, '/').safeJson();
}

export function sendSSOLogIn() {
  window.location = 'mxcube/api/v0.1/login/ssologin';
}

export function sendSignOut() {
  return endpoint.headers({ Accept: '*/*' }).get('/signout').res();
}

export function fetchLoginInfo() {
  return endpoint.get('/login_info').safeJson();
}

export function sendFeedback(sender, content) {
  return endpoint.post({ sender, content }, '/send_feedback').res();
}

export function sendRefreshSession() {
  return endpoint.get('/refresh_session').res();
}
