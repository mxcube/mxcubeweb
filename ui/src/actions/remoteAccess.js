import {
  fetchRemoteAccessState,
  sendCancelControlRequest,
  sendGiveControl,
  sendLogoutUser,
  sendRequestControl,
  sendRespondToControlRequest,
  sendSetAllMessagesRead,
  sendTakeControl,
  sendUpdateAllowRemote,
  sendUpdateNickname,
  sendUpdateTimeoutGivesControl,
} from '../api/remoteAccess';
import { showErrorPanel } from './general';
import { getLoginInfo } from './login';
import { showWaitDialog } from './waitDialog';

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
  return async (dispatch) => {
    try {
      await sendRequestControl(message);

      dispatch(getLoginInfo());
      dispatch(
        showWaitDialog(
          'Asking for control',
          'Please wait while asking for control',
          true,
          () => dispatch(cancelControlRequest()),
        ),
      );
    } catch (error) {
      if (error.status === 409) {
        dispatch(showErrorPanel(true, error.text));
        return;
      }

      throw error;
    }
  };
}

function cancelControlRequest() {
  return async (dispatch) => {
    await sendCancelControlRequest();
    dispatch(getLoginInfo());
  };
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

export function respondToControlRequest(giveCtrl = true, message = '') {
  return async (dispatch) => {
    await sendRespondToControlRequest(giveCtrl, message);
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

export function resetChatMessageCount() {
  return async (dispatch) => {
    await sendSetAllMessagesRead();
    dispatch({ type: 'RESET_CHAT_MESSAGE_COUNT' });
  };
}

export function incChatMessageCount(count = 1) {
  return { type: 'INC_CHAT_MESSAGE_COUNT', count };
}
