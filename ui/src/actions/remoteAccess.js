import {
  fetchChatMessages as apiFetchChatMessages,
  fetchRemoteAccessState,
  sendCancelControlRequest,
  sendChatMessage as apiSendChatMessage,
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
import { store } from '../store';
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

export function setChatMessages(messages) {
  return { type: 'SET_CHAT_MESSAGES', messages };
}

export function addChatMessage(message) {
  return { type: 'ADD_CHAT_MESSAGE', message };
}

export function fetchChatMessages() {
  return async (dispatch) => {
    const { user } = store.getState().login;
    const { messages: fetchedMessages } = await apiFetchChatMessages();

    const built = fetchedMessages.map((entry) => {
      const isSelf = entry.username === user.username;
      let normalizedDate = new Date().toISOString();
      if (entry.date) {
        try {
          const parsedDate = new Date(entry.date);
          if (!Number.isNaN(parsedDate.getTime())) {
            normalizedDate = parsedDate.toISOString();
          }
        } catch {
          // Keep default
        }
      }

      return {
        id: entry.id || `${isSelf ? 'u' : 'r'}-${Date.now()}-${Math.random()}`,
        type: isSelf ? 'user' : 'response',
        text: isSelf
          ? `**You:** \n\n ${entry.message} \n\n`
          : `**${entry.nickname}:** \n\n ${entry.message}`,
        date: normalizedDate,
      };
    });

    const unread = fetchedMessages.reduce(
      (acc, e) => acc + (e.read ? 0 : 1),
      0,
    );

    dispatch(setChatMessages(built));
    dispatch(incChatMessageCount(unread));
  };
}

export function sendChatMessage(message, username) {
  return async (dispatch) => {
    await apiSendChatMessage(message, username);

    const newMessage = {
      id: `u-${Date.now()}-${Math.random()}`,
      type: 'user',
      text: message,
      date: new Date().toISOString(),
    };

    dispatch(addChatMessage(newMessage));
  };
}

export function markAllAsRead() {
  return async (dispatch) => {
    await sendSetAllMessagesRead();
    dispatch(resetChatMessageCount());
  };
}
