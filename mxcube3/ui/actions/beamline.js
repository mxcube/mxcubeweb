import fetch from 'isomorphic-fetch';


// The different states a beamline attribute can assume.
export const STATE = {
  IDLE: 'READY',
  BUSY: 'MOVING',
  ABORT: 'UNUSABLE'
};


/**
 *  Initial redux state for BeamlineSetup container, consists of each
 *  beamline attribute relevant to the beamline setup. Each attribute in turn
 *  have the follwoing proprties:
 *
 *     name:   name of beamline attribute
 *     value:  attributes current value
 *     state:  attributes current state, see STATE for more information
 *     msg:    arbitray message describing current state
 */
export const INITIAL_STATE = {
  energy: {
    limits: [
      0,
      1000,
      0.1
    ],
    name: 'energy',
    value: '0',
    state: STATE.IDLE,
    msg: ''
  },
  resolution: {
    limits: [
      0,
      1000,
      0.1
    ],
    name: 'resolution',
    value: '0',
    state: STATE.IDLE,
    msg: ''
  },
  transmission: {
    limits: [
      0,
      1000,
      0.1
    ],
    name: 'transmission',
    value: '0',
    state: STATE.IDLE,
    msg: ''
  },
  fast_shutter: {
    limits: [
      0,
      1,
      1
    ],
    name: 'fast_shutter',
    value: 'undefined',
    state: 'undefined',
    msg: 'UNKNOWN'
  },
  safety_shutter: {
    limits: [
      0,
      1,
      1
    ],
    name: 'safety_shutter',
    value: 'undefined',
    state: 'undefined',
    msg: 'UNKNOWN'
  },
  beamstop: {
    limits: [
      0,
      1,
      1
    ],
    name: 'beamstop',
    value: 'undefined',
    state: 'undefined',
    msg: 'UNKNOWN'
  },
  capillary: {
    limits: [
      0,
      1,
      1
    ],
    name: 'capillary',
    value: 'undefined',
    state: 'undefined',
    msg: 'UNKNOWN'
  }
};


// Action types
export const BL_ATTR_SET = 'BL_ATTR_SET';
export const BL_ATTR_GET_ALL = 'BL_ATTR_GET_ALL';
export const BL_ATTR_SET_STATE = 'BL_ATTR_SET_STATE';


export function setBeamlineAttrAction(data) {
  return { type: BL_ATTR_SET, data };
}


export function getBeamlineAttrsAction(data) {
  return { type: BL_ATTR_GET_ALL, data };
}


export function busyStateAction(name) {
  return {
    type: BL_ATTR_SET_STATE,
    data: { name, state: STATE.BUSY }
  };
}


export function getAllAttributesRequest() {
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


export function setAttributeRequest(name, value) {
  const url = `mxcube/api/v0.1/beamline/${name}`;

  return (dispatch) => {
    dispatch(busyStateAction(name));
    fetch(url, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, value })
    }).then(response => response.json())
          .then(data => {
            dispatch(setBeamlineAttrAction(data));
          }, () => {
            throw new Error(`PUT ${url} failed`);
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
