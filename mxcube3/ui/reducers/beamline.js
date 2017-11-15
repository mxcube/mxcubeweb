import { STATE } from '../actions/beamline';
import { RUNNING } from '../constants';

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
  attributes: {
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
    flux: {
      limits: [
        0,
        1000,
        0.1
      ],
      name: 'flux',
      value: '0',
      state: 'STATE.IDLE',
      msg: 'UNKNOWN'
    },
    machinfo: {
      limits: [],
      name: 'machinfo',
      value: { current: -1, message: '', fillmode: '' },
      state: 'STATE.IDLE',
      msg: 'UNKNOWN'
    },
  },
  motors: {
    focus: { position: 0, state: 0 },
    phi: { position: 0, state: 0 },
    phiy: { position: 0, state: 0 },
    phiz: { position: 0, state: 0 },
    sampx: { position: 0, state: 0 },
    sampy: { position: 0, state: 0 },
    BackLight: { position: 0, state: 0 },
    FrontLight: { position: 0, state: 0 },
    BackLightSwitch: { position: 0, state: 0 },
    FrontLightSwitch: { position: 0, state: 0 },
    kappa: { position: 0, state: 0 },
    kappa_phi: { position: 0, state: 0 },
    zoom: { position: 0, state: 0 }
  },
  zoom: 0,
  beamlineActionsList: [],
  currentBeamlineAction: { show: false, messages: [], arguments: [] },
  motorInputDisable: false,
  lastPlotId: null,
  plotsInfo: {},
  plotsData: {}
};


export default (state = INITIAL_STATE, action) => {
  let data = {};

  switch (action.type) {
    case 'BL_ATTR_GET_ALL':
      return Object.assign({}, state, action.data);

    case 'BL_ATTR_SET':
      {
        const attrData = Object.assign(state.attributes[action.data.name] || {}, action.data);
        return { ...state, attributes: { ...state.attributes,
                                         [action.data.name]: attrData
                                       }
               };
      }
    case 'BL_ACT_SET':
      return { ...state, actuators: { ...state.actuators,
                                    [action.data.name]: action.data
                                    }
             };
    case 'BL_ATTR_SET_STATE':
      data = Object.assign({}, state);
      data.attributes[action.data.name].state = action.data.state;
      return data;

    case 'SET_MOTOR_MOVING':
      return { ...state,
               motorInputDisable: true,
               motors: { ...state.motors, [action.name.toLowerCase()]:
                                   { ...state.motors[action.name.toLowerCase()],
                                     state: action.status
                                   }
                       }
             };

    case 'SAVE_MOTOR_POSITIONS':
      return { ...state,
                motors: { ...state.motors, ...action.data },
                zoom: action.data.zoom.position
      };
    case 'SAVE_MOTOR_POSITION':
      return { ...state, motors: { ...state.motors, [action.name]:
                                   { position: action.value,
                                     state: state.motors[action.name].state }
                                 }
             };
    case 'UPDATE_MOTOR_STATE':
      return { ...state,
               motorInputDisable: action.value !== 2,
               motors: { ...state.motors, [action.name]:
                                   { position: state.motors[action.name].position,
                                     state: action.value }
                       }
             };
    case 'SET_INITIAL_STATE':
      return { ...INITIAL_STATE,
        motors: { ...INITIAL_STATE.motors, ...action.data.Motors },
        attributes: { ...INITIAL_STATE.actuators, ...action.data.beamlineSetup.attributes },
        motorsLimits: { ...INITIAL_STATE.motorsLimits,
                        ...action.data.motorsLimits },
        zoom: action.data.Motors.zoom.position,
        beamlineActionsList: action.data.beamlineSetup.actionsList.slice(0)
      };
    case 'BL_MACH_INFO':
      return { ...state,
        machinfo: { ...state.machinfo, ...action.info },
      };
    case 'ACTION_SET_STATE':
      {
        const beamlineActionsList = JSON.parse(JSON.stringify(state.beamlineActionsList));
        const currentBeamlineAction = {};
        state.beamlineActionsList.some((beamlineAction, i) => {
          if (beamlineAction.name === action.cmdName) {
            beamlineActionsList[i].state = action.state;
            if (action.state === RUNNING) {
              beamlineActionsList[i].messages = [];
            }
            Object.assign(currentBeamlineAction, state.currentBeamlineAction,
                          JSON.parse(JSON.stringify(beamlineActionsList[i])));
            return true;
          }
          return false;
        });
        return { ...state, beamlineActionsList, currentBeamlineAction };
      }
    case 'ACTION_SET_ARGUMENT':
      {
        const beamlineActionsList = JSON.parse(JSON.stringify(state.beamlineActionsList));
        const currentBeamlineAction = {};
        state.beamlineActionsList.some((beamlineAction, i) => {
          if (beamlineAction.name === action.cmdName) {
            beamlineActionsList[i].arguments[action.argIndex].value = action.value;
            Object.assign(currentBeamlineAction, state.currentBeamlineAction,
                          JSON.parse(JSON.stringify(beamlineActionsList[i])));
            return true;
          }
          return false;
        });

        return { ...state, beamlineActionsList, currentBeamlineAction };
      }
    case 'ACTION_SHOW_OUTPUT':
      {
        const currentBeamlineAction = {};
        state.beamlineActionsList.some((beamlineAction) => {
          if (beamlineAction.name === action.cmdName) {
            Object.assign(currentBeamlineAction, JSON.parse(JSON.stringify(beamlineAction)),
                          { show: true });
            return true;
          }
          return false;
        });
        return { ...state, currentBeamlineAction };
      }
    case 'ACTION_HIDE_OUTPUT':
      {
        return { ...state,
                 currentBeamlineAction:
                   Object.assign({},
                   JSON.parse(JSON.stringify(state.currentBeamlineAction)),
                   { show: false })
               };
      }
    case 'ADD_USER_MESSAGE':
      {
        if (state.currentBeamlineAction.state !== RUNNING) {
          return state;
        }

        const cmdName = state.currentBeamlineAction.name;
        const beamlineActionsList = JSON.parse(JSON.stringify(state.beamlineActionsList));
        const currentBeamlineAction = {};
        state.beamlineActionsList.some((beamlineAction, i) => {
          if (beamlineAction.name === cmdName) {
            beamlineActionsList[i].messages.push(action.message);
            Object.assign(currentBeamlineAction, state.currentBeamlineAction,
                          JSON.parse(JSON.stringify(beamlineActionsList[i])));
            return true;
          }
          return false;
        });

        return { ...state, beamlineActionsList, currentBeamlineAction };
      }
    case 'NEW_PLOT':
      {
        const plotId = action.plotInfo.id;
        const plotsInfo = { ...state.plotsInfo, [plotId]: { labels: action.plotInfo.labels,
                                                            title: action.plotInfo.title,
                                                            end: false } };
        const plotsData = { ...state.plotsData };
        plotsData[plotId] = [];

        return { ...state, plotsInfo, plotsData, lastPlotId: plotId };
      }
    case 'PLOT_DATA':
      {
        const plotsData = { ...state.plotsData };
        if (action.fullDataSet) {
          plotsData[action.id] = action.data;
        } else {
          const plotData = [...plotsData[action.id]];
          plotData.push(...action.data);
          plotsData[action.id] = plotData;
        }
        return { ...state, plotsData };
      }
    case 'PLOT_END':
      {
        const plotsInfo = { ...state.plotsInfo };
        const plotInfo = plotsInfo[action.id];
        plotInfo.end = true;
        plotsInfo[action.id] = plotInfo;
        return { ...state, plotsInfo };
      }
    default:
      return state;
  }
};
