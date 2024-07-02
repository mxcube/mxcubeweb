/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */

import {
  fetchRemoteAccessState,
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
  return (dispatch) => {
    fetchRemoteAccessState().then((data) => {
      dispatch({ type: 'SET_RA_STATE', data: data.data });
    });
  };
}

export function updateNickname(name) {
  return (dispatch) => {
    sendUpdateNickname(name).then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function requestControl(
  control = true,
  message = '',
  name = '',
  userInfo = {},
) {
  return () => {
    sendRequestControl(control, message, name, userInfo);
  };
}

export function takeControl() {
  return (dispatch) => {
    sendTakeControl().then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function giveControl(username) {
  return (dispatch) => {
    sendGiveControl(username).then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function logoutUser(username) {
  return (dispatch) => {
    sendLogoutUser(username).then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function respondToControlRequest(giveControl = true, message = '') {
  return (dispatch) => {
    sendRespondToControlRequest(giveControl, message).then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function updateAllowRemote(allow) {
  return (dispatch) => {
    sendUpdateAllowRemote(allow);
    dispatch({ type: 'SET_ALLOW_REMOTE', allow });
  };
}

export function updateTimeoutGivesControl(timeoutGivesControl) {
  return (dispatch) => {
    sendUpdateTimeoutGivesControl(timeoutGivesControl);
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
