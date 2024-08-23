import api from '.';

const endpoint = api.url('/ra');

export function fetchRemoteAccessState() {
  return endpoint.get('/').safeJson();
}

export function sendUpdateAllowRemote(allow) {
  return endpoint.post({ allow }, '/allow_remote').res();
}

export function sendUpdateTimeoutGivesControl(timeoutGivesControl) {
  return endpoint.post({ timeoutGivesControl }, '/timeout_gives_control').res();
}

export function sendUpdateNickname(name) {
  return endpoint.post({ name }, '/update_user_nickname').res();
}

export function sendRequestControl(message) {
  return endpoint.post({ message }, '/request_control').res();
}

export function sendCancelControlRequest() {
  return endpoint.post(undefined, '/cancel_request').res();
}

export function sendRespondToControlRequest(giveControl, message) {
  return endpoint
    .post({ giveControl, message }, '/request_control_response')
    .res();
}

export function sendTakeControl() {
  return endpoint.post(undefined, '/take_control').res();
}

export function sendGiveControl(username) {
  return endpoint.post({ username }, '/give_control').res();
}

export function sendLogoutUser(username) {
  return endpoint.post({ username }, '/logout_user').res();
}

export function fetchChatMessages() {
  return endpoint.get('/chat').safeJson();
}

export function sendChatMessage(message, username) {
  return endpoint.post({ message, username }, '/chat').res();
}

export function sendSetAllMessagesRead(message, username) {
  return endpoint.post({ message, username }, '/chat/set_all_read').res();
}
