import fetch from 'isomorphic-fetch';

import { showErrorPanel } from './general';


// The different states a beamline attribute can assume.
export const STATE = {
  IDLE: 'READY',
  BUSY: 'MOVING',
  ABORT: 'UNUSABLE'
};

export function updateMovableState(name, value) {
  return {
    type: 'UPDATE_MOVABLE_STATE', name, value
  };
}

export function updateMovable(name, data) {
  return {
    type: 'UPDATE_MOVABLE', name, data
  };
}

export function saveMovablePosition(name, value) {
  return {
    type: 'SAVE_MOVABLE_VALUE', name, value
  };
}

export function setMovableMoving(name, status) {
  return {
    type: 'SET_MOVABLE_MOVING', name, status
  };
}

export function getBeamlineAttrsAction(data) {
  return { type: 'BL_ATTR_GET_ALL', data };
}

export function setMachInfo(info) {
  return { type: 'BL_MACH_INFO', info };
}

export function busyStateAction(name) {
  return {
    type: 'UPDATE_MOVABLE_STATE',
    data: { name, state: STATE.BUSY }
  };
}

export function sendGetAllAttributes() {
  const url = 'mxcube/api/v0.1/beamline';

  return (dispatch) => {
    fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => response.json())
          .then(data => {
            dispatch(getBeamlineAttrsAction(data));
          }, () => {
            throw new Error(`GET ${url} failed`);
          });
  };
}

export function sendStopMovable(motorName) {
  return function () {
    fetch(`/mxcube/api/v0.1/beamline/movable/${motorName}/stop`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Server refused to stop motor');
      }
    });
  };
}

export function sendMovablePosition(name, value) {
  return function (dispatch) {
    fetch(`/mxcube/api/v0.1/beamline/movable/${name}/${value}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    }).then((response) => {
      if (response.status >= 400) {
        const msg = `Server refused to set ${name} to ${value}`;
        dispatch(showErrorPanel(true, msg));
        throw new Error(msg);
      }
    });
  };
}

export function sendPrepareForNewSample() {
  return () => {
    fetch('mxcube/api/v0.1/beamline/prepare_beamline', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
  };
}
