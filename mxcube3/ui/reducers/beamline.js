import { STATE } from '../actions/beamline';
import { RUNNING } from '../constants';

/**
 *  Initial redux state for beamline movables, object containing each beamline
 *  attribute (name, attribute object). Each attribute object in turn have the
 *  follwoing properties:
 *
 *     name:   name of beamline attribute
 *     value:  movables current value
 *     state:  movables current state, see STATE for more information
 *     msg:    arbitray message describing current state
 */
export const INITIAL_STATE = {
  movables: {
    fast_shutter: {
      limits: [
        0,
        1,
        1
      ],
      name: 'fast_shutter',
      value: 'undefined',
      state: 'undefined',
      msg: 'UNKNOWN',
      readonly: false
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
      msg: 'UNKNOWN',
      readonly: false
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
      msg: 'UNKNOWN',
      readonly: false
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
      msg: 'UNKNOWN',
      readonly: false
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
      msg: '',
      readonly: false
    },
    wavelength: {
      limits: [
        0,
        1000,
        0.1
      ],
      name: 'energy',
      value: '0',
      state: STATE.IDLE,
      msg: '',
      readonly: false
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
      msg: '',
      readonly: false
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
      msg: '',
      readonly: false
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
      msg: 'UNKNOWN',
      readonly: false
    },
    cryo: {
      limits: [
        0,
        1000,
        0.1
      ],
      name: 'cryo',
      value: '0',
      state: 'STATE.IDLE',
      msg: 'UNKNOWN',
      readonly: false
    },
    machinfo: {
      limits: [],
      name: 'machinfo',
      value: { current: -1, message: '', fillmode: '' },
      state: 'STATE.IDLE',
      msg: 'UNKNOWN',
      readonly: false
    },
    focus: { value: 0, state: 0, limits: [0, 1] },
    phi: { value: 0, state: 0, limits: [0, 1] },
    phiy: { value: 0, state: 0, limits: [0, 1] },
    phiz: { value: 0, state: 0, limits: [0, 1] },
    sampx: { value: 0, state: 0, limits: [0, 1] },
    sampy: { value: 0, state: 0, limits: [0, 1] },
    BackLight: { value: 0, state: 0, limits: [0, 1] },
    FrontLight: { value: 0, state: 0, limits: [0, 1] },
    BackLightSwitch: { value: 0, state: 0, limits: [0, 1] },
    FrontLightSwitch: { value: 0, state: 0, limits: [0, 1] },
    kappa: { value: 0, state: 0, limits: [0, 1] },
    kappa_phi: { value: 0, state: 0, limits: [0, 1] },
    zoom: { value: 0, state: 0, limits: [0, 1] },
    sample_horizontal: { value: 0, state: 0, limits: [0, 1] },
    sample_vertical: { value: 0, state: 0, limits: [0, 1] }
  },
  beamlineActionsList: [],
  currentBeamlineAction: { show: false, messages: [], arguments: [] },
  motorInputDisable: false,
  lastPlotId: null,
  plotsInfo: {},
  plotsData: {},
  availableMethods: {},
  energyScanElements: []
};


export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'BL_ATTR_GET_ALL':
      return Object.assign({}, state, action.data);

    case 'SET_MOVABLE_MOVING':
      return { ...state,
               motorInputDisable: true,
               movables: { ...state.movables, [action.name.toLowerCase()]:
                                   { ...state.movables[action.name.toLowerCase()],
                                     state: action.status
                                   }
                       }
             };
    case 'SAVE_MOVABLE_VALUE':
      return { ...state, movables: { ...state.movables, [action.name]:
                                   { ...state.movables[action.name],
                                     value: action.value,
                                     state: state.movables[action.name].state }
                                 }
             };
    case 'UPDATE_MOVABLE_STATE':
      return { ...state,
               motorInputDisable: action.value !== 2,
               movables: { ...state.movables, [action.name]:
                         { ...state.movables[action.name],
                           value: state.movables[action.name].value,
                           state: action.value }
                       }
             };
    case 'UPDATE_MOVABLE':
      {
        const movableData = Object.assign(state.movables[action.data.name] || {}, action.data);

        return { ...state, movables: { ...state.movables,
                                       [action.name]: movableData
                                     }
               };
      }
    case 'SET_INITIAL_STATE':
      return { ...INITIAL_STATE,
        movables: { ...INITIAL_STATE.movables, ...action.data.beamlineSetup.movables },
        movablesLimits: { ...INITIAL_STATE.movablesLimits,
                        ...action.data.movablesLimits },
        beamlineActionsList: action.data.beamlineSetup.actionsList.slice(0),
        availableMethods: action.data.beamlineSetup.availableMethods,
        energyScanElements: action.data.beamlineSetup.energyScanElements
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
            beamlineActionsList[i].data = action.data;

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
