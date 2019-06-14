import { serverIO } from '../serverIO';

export function showObserverDialog(show = true) {
  return { type: 'SHOW_OBSERVER_DIALOG', show };
}

export function setMaster(master, name) {
  return function (dispatch) {
    if (master) {
      serverIO.setRemoteAccessMaster(name, (sid) => {
        dispatch({ type: 'SET_MASTER', master, sid, name });
      });
    } else {
      if (!master && !name) {
        dispatch(showObserverDialog(true));
      }

      serverIO.setRemoteAccessObserver(name, (sid) => {
        dispatch({ type: 'SET_MASTER', master, sid, name });
      });
    }
  };
}

export function requestControlAction(control) {
  return { type: 'REQUEST_CONTROL', control };
}

export function requestControl(control = true, message = '', name = '', userInfo = { }) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/ra/request_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ control, message, name, userInfo })
    });

    dispatch(requestControlAction(control));
  };
}

export function sendTakeControl() {
  return function () {
    fetch('mxcube/api/v0.1/ra/take_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
  };
}

export function sendGiveControl(sid) {
  return function () {
    fetch('mxcube/api/v0.1/ra/give_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ sid })
    });
  };
}

export function requestControlResponse(giveControl = true, message = '') {
  fetch('mxcube/api/v0.1/ra/request_control_response', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ giveControl, message })
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
  return function (dispatch) {
    fetch('mxcube/api/v0.1/ra/allow_remote', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ allow })
    });

    dispatch(setAllowRemoteAccess(allow));
  };
}


export function sendTimeoutGivesControl(timeoutGivesControl) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/ra/timeout_gives_control', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ timeoutGivesControl })
    });

    dispatch(setTimeoutGivesControl(timeoutGivesControl));
  };
}


export function setObservers(observers) {
  return { type: 'SET_OBSERVERS', observers };
}

export function setUsers(users) {
  return { type: 'SET_USERS', users };
}

export function sendChatMessage(message, sid) {
  return fetch('mxcube/api/v0.1/ra/chat', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ message, sid })
  });
}

export function getAllChatMessages() {
  return fetch('mxcube/api/v0.1/ra/chat', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    }
  }).then((response) => response.json());
}


export function resetChatMessageCount() {
  return { type: 'RESET_CHAT_MESSAGE_COUNT' };
}


export function incChatMessageCount() {
  return { type: 'INC_CHAT_MESSAGE_COUNT' };
}
