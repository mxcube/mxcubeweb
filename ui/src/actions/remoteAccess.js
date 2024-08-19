import {
  fetchRemoteAccessState,
  sendCancelControlRequest,
  sendGiveControl,
  sendLogoutUser,
  sendRequestControl,
  sendRespondToControlRequest,
  sendTakeControl,
  sendUpdateAllowRemote,
  sendUpdateNickname,
  sendUpdateTimeoutGivesControl,
} from '../api/remoteAccess';
import { getLoginInfo } from './login';

export function showObserverDialog(show = true) {
  return { type: 'SHOW_OBSERVER_DIALOG', show };
}

export function getRaState() {
  return async (dispatch) => {
    const data = await fetchRemoteAccessState();
    dispatch({ type: 'SET_RA_STATE', data: data.data });
  };
}

export function updateNickname(name) {
  return async (dispatch) => {
    await sendUpdateNickname(name);
    dispatch(getLoginInfo());
    dispatch(getRaState());
  };
}

export function requestControl(message) {
  return () => sendRequestControl(message);
}

export function cancelControlRequest() {
  return () => sendCancelControlRequest();
}

export function takeControl() {
  return async (dispatch) => {
    await sendTakeControl();
    dispatch(getLoginInfo());
    dispatch(getRaState());
  };
}

export function giveControl(username) {
  return async (dispatch) => {
    await sendGiveControl(username);
    dispatch(getLoginInfo());
    dispatch(getRaState());
  };
}

export function logoutUser(username) {
  return async (dispatch) => {
    await sendLogoutUser(username);
    dispatch(getLoginInfo());
    dispatch(getRaState());
  };
}

export function respondToControlRequest(giveControl = true, message = '') {
  return async (dispatch) => {
    await sendRespondToControlRequest(giveControl, message);
    dispatch(getLoginInfo());
    dispatch(getRaState());
  };
}

export function updateAllowRemote(allow) {
  return async (dispatch) => {
    await sendUpdateAllowRemote(allow);
    dispatch({ type: 'SET_ALLOW_REMOTE', allow });
  };
}

export function updateTimeoutGivesControl(timeoutGivesControl) {
  return async (dispatch) => {
    await sendUpdateTimeoutGivesControl(timeoutGivesControl);
    dispatch({ type: 'SET_TIMEOUT_GIVES_CONTROL', timeoutGivesControl });
  };
}

export function setObservers(observers) {
  return { type: 'SET_OBSERVERS', observers };
}

export function resetChatMessageCount() {
  return { type: 'RESET_CHAT_MESSAGE_COUNT' };
}

export function incChatMessageCount() {
  return { type: 'INC_CHAT_MESSAGE_COUNT' };
}
