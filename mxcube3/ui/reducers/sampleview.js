import { omit } from 'lodash/object';
const initialState = {
  clickCentring: false,
  clickCentringPoints: [],
  zoom: 0,
  points: {},
  width: 659,
  height: 493,
  motorSteps: {
    focusStep: 0.1,
    phiStep: 90,
    phiyStep: 0.1,
    phizStep: 0.1,
    sampxStep: 0.1,
    sampyStep: 0.1,
    kappaStep: 0.1,
    kappaphiStep: 0.1
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
  pixelsPerMm: 0,
  imageRatio: 0,
  contextMenu: { show: false, shape: { type: 'NONE' }, x: 0, y: 0 },
  apertureList: [],
  currentAperture: 0,
  currentPhase: '',
  beamPosition: [0, 0]
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_ZOOM':
      {
        return { ...state, zoom: action.level, pixelsPerMm: action.pixelsPerMm };
      }
    case 'START_CLICK_CENTRING':
      {
        return { ...state, clickCentring: true, clickCentringPoints: [] };
      }
    case 'STOP_CLICK_CENTRING':
      {
        return { ...state, clickCentring: false, clickCentringPoints: [] };
      }
    case 'ADD_CENTRING_POINT':
      {
        return (
          state.clickCentringPoints.length === 2 ?
            { ...state, clickCentring: false, clickCentringPoints: [] } :
            {
              ...state,
              clickCentringPoints: [...state.clickCentringPoints,
              { x: action.x, y: action.y }]
            }
        );
      }
    case 'SAVE_POINT':
      {
        return { ...state, points: { ...state.points, [action.point.posId]: action.point } };
      }
    case 'DELETE_POINT':
      {
        return { ...state, points: omit(state.points, action.id) };
      }
    case 'SAVE_IMAGE_SIZE':
      {
        return {
          ...state,
          width: action.width,
          height: action.height,
          pixelsPerMm: action.pixelsPerMm
        };
      }
    case 'SAVE_MOTOR_POSITIONS':
      {
        return {
          ...state,
          motors: { ...state.motors, ...action.data },
          zoom: action.data.zoom.position,
          pixelsPerMm: action.data.pixelsPerMm[0]
        };
      }
    case 'SAVE_MOTOR_POSITION':
      {
        return {
          ...state,
          motors: { ...state.motors,
            [action.name]: { position: action.value }
          }
        };
      }
    case 'UPDATE_POINTS_POSITION':
      {
        return { ...state, points: action.points };
      }
    case 'SHOW_CONTEXT_MENU':
      {
        return {
          ...state,
          contextMenu: {
            show: action.show,
            shape: action.shape,
            x: action.x, y: action.y
          }
        };
      }
    case 'SET_BEAM_POSITION':
      {
        return { ...state, beamPosition: action.position };
      }
    case 'SET_IMAGE_RATIO':
      {
        return { ...state, imageRatio: state.width / action.clientWidth };
      }
    case 'SET_APERTURE':
      {
        return { ...state, currentAperture: action.size };
      }
    case 'SET_BEAM_INFO':
      {
        return {
          ...state,
          beamPosition: action.info.position,
          currentAperture: action.info.size_x * 1000
        };
      }
    case 'SET_CURRENT_PHASE':
      {
        return { ...state, currentPhase: action.phase };
      }
    case 'MOUNT_SAMPLE':
      {
        return { ...state, points: {} };
      }
    case 'UNMOUNT_SAMPLE':
      {
        return { ...state, points: {} };
      }
    case 'SET_STEP_SIZE':
      {
        return { ...state, motorSteps: { ...state.motorSteps, [action.name]: action.value } };
      }
    case 'SET_INITIAL_STATUS':
      {
        return {
          ...state,
          motors: { ...state.motors, ...action.data.Motors },
          zoom: action.data.Motors.zoom.position,
          width: action.data.Camera.imageWidth,
          height: action.data.Camera.imageHeight,
          pixelsPerMm: action.data.Camera.pixelsPerMm[0],
          apertureList: action.data.beamInfo.apertureList,
          currentAperture: action.data.beamInfo.currentAperture,
          beamPosition: action.data.beamInfo.position,
          points: action.data.points
        };
      }
    default:
      return state;
  }
};
