/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable sonarjs/no-duplicate-string */
import { getLoginInfo } from './login'; // eslint-disable-line import/no-cycle

export function showObserverDialog(show = true) {
  return { type: 'SHOW_OBSERVER_DIALOG', show };
}

export function setRaState(data) {
  return { type: 'SET_RA_STATE', data };
}

export function getRaState() {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/ra/', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        dispatch(setRaState(data.data));
      });
  };
}

export function sendUpdateNickname(name) {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/ra/update_user_nickname', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ name }),
    }).then(() => {
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
    fetch('mxcube/api/v0.1/ra/request_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        control,
        message,
        name,
        userInfo,
      }),
    });
  };
}

export function sendTakeControl() {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/ra/take_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function sendGiveControl(username) {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/ra/give_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ username }),
    }).then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function sendLogoutUser(username) {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/ra/logout_user', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ username }),
    }).then(() => {
      dispatch(getLoginInfo());
      dispatch(getRaState());
    });
  };
}

export function requestControlResponse(giveControl = true, message = '') {
  fetch('mxcube/api/v0.1/ra/request_control_response', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ giveControl, message }),
  });

  return { type: 'REQUEST_CONTROL_RESPONSE' };
}

export function setAllowRemoteAccess(allow) {
  return { type: 'SET_ALLOW_REMOTE', allow };
}

export function setTimeoutGivesControl(timeoutGivesControl) {
  return { type: 'SET_TIMEOUT_GIVES_CONTROL', timeoutGivesControl };
}

export function sendAllowRemote(allow) {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/ra/allow_remote', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ allow }),
    });

    dispatch(setAllowRemoteAccess(allow));
  };
}

export function sendTimeoutGivesControl(timeoutGivesControl) {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/ra/timeout_gives_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ timeoutGivesControl }),
    });

    dispatch(setTimeoutGivesControl(timeoutGivesControl));
  };
}

export function setObservers(observers) {
  return { type: 'SET_OBSERVERS', observers };
}

export function sendChatMessage(message, username) {
  return fetch('mxcube/api/v0.1/ra/chat', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ message, username }),
  });
}

export function getAllChatMessages() {
  return fetch('mxcube/api/v0.1/ra/chat', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  }).then((response) => response.json());
}

export function resetChatMessageCount() {
  return { type: 'RESET_CHAT_MESSAGE_COUNT' };
}

export function incChatMessageCount() {
  return { type: 'INC_CHAT_MESSAGE_COUNT' };
}
