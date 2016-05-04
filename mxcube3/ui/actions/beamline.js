import fetch from 'isomorphic-fetch';
import { SET_ATTRIBUTE, SET_ALL_ATTRIBUTES, SET_BUSY_STATE, STATE } from './beamline_atypes';


export function beamlinePropertyValueAction(data) {
  return { type: SET_ATTRIBUTE, data };
}


export function beamlinePropertiesAction(data) {
  return { type: SET_ALL_ATTRIBUTES, data };
}


export function busyStateAction(name) {
  return {
    type: SET_BUSY_STATE,
    data: { name, state: STATE.BUSY }
  };
}


export function getAllAttributes() {
  return (dispatch) => {
    fetch('mxcube/api/v0.1/beamline', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => response.json())
          .then(data => {
            dispatch(beamlinePropertiesAction(data));
          }, () => {
            throw new Error('Server connection problem (login)');
          });
  };
}


export function setAttribute(name, value) {
  return (dispatch) => {
    dispatch(busyStateAction(name));
    fetch(`mxcube/api/v0.1/beamline/${name}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, value })
    }).then(response => response.json())
          .then(data => {
            dispatch(beamlinePropertyValueAction(data));
          }, () => {
            throw new Error('Server connection problem');
          });
  };
}


export function abortCurrentAction(name) {
  return () => {
    fetch(`mxcube/api/v0.1/beamline/${name}/abort`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    });
  };
}
