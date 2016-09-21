import { omit } from 'lodash/object';
const initialState = {
  clickCentring: false,
  clickCentringPoints: [],
  measureDistance: false,
  distancePoints: [],
  zoom: 0,
  points: {},
  lines: [],
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
  pixelsPerMm: 0,
  imageRatio: 0,
  apertureList: [],
  currentAperture: 0,
  currentPhase: '',
  beamPosition: [0, 0],
  beamShape: 'elipse',
  beamSize: { x: 0, y: 0 },
  cinema: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'TOOGLE_CINEMA':
      {
        return { ...state, cinema: !state.cinema };
      }
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
    case 'ADD_LINE':
      {
        return { ...state, lines: [...state.lines, { p1: action.p1, p2: action.p2 }] };
      }
    case 'MEASURE_DISTANCE':
      {
        return { ...state, measureDistance: action.mode, distancePoints: [] };
      }
    case 'ADD_DISTANCE_POINT':
      {
        return (
          state.distancePoints.length === 2 ?
            { ...state, measureDistance: false, distancePoints: [] } :
            {
              ...state,
              distancePoints: [...state.distancePoints,
              { x: action.x, y: action.y }]
            }
        );
      }
    case 'SAVE_POINT':
      {
        return { ...state, points: { ...state.points, [action.point.posId]: action.point } };
      }
    case 'DELETE_LINE':
      {
        return { ...state,
          lines: [...state.lines.slice(0, action.id), ...state.lines.slice(action.id + 1)]
        };
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
    case 'UPDATE_POINTS_POSITION':
      {
        return { ...state, points: action.points };
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
          beamShape: action.info.shape,
          beamSize: { x: action.info.size_x, y: action.info.size_y }
        };
      }
    case 'SET_CURRENT_PHASE':
      {
        return { ...state, currentPhase: action.phase };
      }
    case 'MOUNT_SAMPLE':
      {
        return { ...state, points: {}, lines: [] };
      }
    case 'UNMOUNT_SAMPLE':
      {
        return { ...state, points: {}, lines: [] };
      }
    case 'SET_STEP_SIZE':
      {
        return { ...state, motorSteps: { ...state.motorSteps, [action.name]: action.value } };
      }
    case 'SAVE_MOTOR_POSITIONS':
      {
        return { ...state,
                 zoom: action.data.zoom.position,
                 pixelsPerMm: action.data.pixelsPerMm[0]
               };
      }
    case 'CLEAR_ALL':
      {
        return Object.assign({},
          state,
          { lines: [], points: {}, distancePoints: [], clickCentringPoints: [] }
        );
      }
    case 'SET_INITIAL_STATUS':
      {
        return {
          ...state,
          zoom: action.data.Motors.zoom.position,
          width: action.data.Camera.imageWidth,
          height: action.data.Camera.imageHeight,
          pixelsPerMm: action.data.Camera.pixelsPerMm[0],
          apertureList: action.data.beamInfo.apertureList,
          currentAperture: action.data.beamInfo.currentAperture,
          beamPosition: action.data.beamInfo.position,
          beamShape: action.data.beamInfo.shape,
          beamSize: { x: action.data.beamInfo.size_x, y: action.data.beamInfo.size_y },
          points: action.data.points,
          lines: []
        };
      }
    default:
      return state;
  }
};
