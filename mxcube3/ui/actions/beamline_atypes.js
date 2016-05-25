// The different states a beamline attribute can assume.
export const STATE = {
  IDLE: 'READY',
  BUSY: 'MOVING',
  ABORT: 'UNUSABLE'
};


/**
 *  Initial redux state for BeamlineSetup container, consists of each
 *  beamline attribute relevent to the beamline setup. Each attribute in turn
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
export const SET_ATTRIBUTE = 'SET_ATTRIBUTE';
export const SET_ALL_ATTRIBUTES = 'SET_ALL_ATTRIBUTES';
export const SET_BUSY_STATE = 'SET_BUSY_STATE';
