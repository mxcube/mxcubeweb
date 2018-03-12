import { serverIO } from '../serverIO';

export function setMaster(master, name = null) {
  return function (dispatch) {
    if (master) {
      serverIO.setRemoteAccessMaster((sid) => {
        dispatch({ type: 'SET_MASTER', master, sid, name });
      });
    } else {
      serverIO.setRemoteAccessObserver(master, name, (sid) => {
        dispatch({ type: 'SET_MASTER', master, name, sid });
      });
    }
    // Set master status directly
    dispatch({ type: 'SET_MASTER', master, name, sid: null });
  };
}

export function requestControlAction(control) {
  return { type: 'REQUEST_CONTROL', control };
}

export function requestControl(control = true, message = '', name = '', userInfo = { }) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/login/request_control', {
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

export function requestControlResponse(giveControl = true, message = '') {
  fetch('mxcube/api/v0.1/login/request_control_response', {
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

export function showObserverDialog(show = true) {
  return { type: 'SHOW_OBSERVER_DIALOG', show };
}

export function setObservers(observers) {
  return { type: 'SET_OBSERVERS', observers };
}


export function sendChatMessage(message, sid) {
  return fetch('mxcube/api/v0.1/chat', {
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
  return fetch('mxcube/api/v0.1/chat', {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    }
  }).then((response) => response.json());
}
