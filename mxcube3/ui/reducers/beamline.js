import { STATE,
         BL_ATTR_SET,
         BL_ATTR_GET_ALL,
         BL_ATTR_SET_STATE } from '../actions/beamline';

/**
 *  Initial redux state for beamline attributes, object containing each beamline
 *  attribute (name, attribute object). Each attribute object in turn have the
 *  follwoing properties:
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
  },
  motors: {
    focus: { position: 0, Status: 0 },
    phi: { position: 0, Status: 0 },
    phiy: { position: 0, Status: 0 },
    phiz: { position: 0, Status: 0 },
    sampx: { position: 0, Status: 0 },
    sampy: { position: 0, Status: 0 },
    BackLight: { position: 0, Status: 0 },
    FrontLight: { position: 0, Status: 0 },
    BackLightSwitch: { position: 0, Status: 0 },
    FrontLightSwitch: { position: 0, Status: 0 },
    kappa: { position: 0, Status: 0 },
    kappa_phi: { position: 0, Status: 0 }
  },
  machinfo: { current: -1, message: '' },
  pixelsPerMm: 0,
  zoom: 0
};


export default (state = INITIAL_STATE, action) => {
  let data = {};

  switch (action.type) {
    case BL_ATTR_GET_ALL:
      return Object.assign({}, state, action.data);

    case BL_ATTR_SET:
      data[action.data.name] = { name: action.data.name,
                                 value: action.data.value,
                                 state: action.data.state,
                                 msg: action.data.msg };

      return Object.assign({}, state, data);

    case BL_ATTR_SET_STATE:
      data = Object.assign({}, state);
      data[action.data.name].state = action.data.state;

      return data;
    case 'SET_MOTOR_MOVING':
      return { ...state, motors: { ...state.motors, [action.name.toLowerCase()]:
                                   { ...state.motors[action.name.toLowerCase()],
                                     Status: action.status
                                   }
      } };
    case 'SAVE_MOTOR_POSITIONS':
      return { ...state,
                motors: { ...state.motors, ...action.data },
                zoom: action.data.zoom.position,
                pixelsPerMm: action.data.pixelsPerMm[0]
      };
    case 'SAVE_MOTOR_POSITION':
      return { ...state, motors: { ...state.motors, [action.name]:
                                   { position: action.value,
                                     Status: state.motors[action.name].Status }
                                 }
             };
    case 'UPDATE_MOTOR_STATE':
      return { ...state, motors: { ...state.motors, [action.name]:
                                   { position: state.motors[action.name].position,
                                     Status: action.value }
                                 }
             };
    case 'SET_INITIAL_STATE':
      return { ...state,
        motors: { ...state.motors, ...action.data.Motors },
        motorsLimits: { ...action.data.motorsLimits, ...action.data.beamlineSetup },
        pixelsPerMm: action.data.Camera.pixelsPerMm[0],
        zoom: action.data.Motors.zoom.position
      };
    case 'BL_MACH_INFO':
      return { ...state,
        machinfo: { ...state.machinfo, ...action.info },
      };
    default:
      return state;
  }
};
