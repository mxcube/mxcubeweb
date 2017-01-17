const initialState = {
  clickCentring: false,
  clickCentringPoints: [],
  measureDistance: false,
  distancePoints: [],
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
  imageRatio: 0,
  apertureList: [],
  currentAperture: 0,
  currentPhase: '',
  beamPosition: [0, 0],
  beamShape: 'elipse',
  beamSize: { x: 0, y: 0 },
  cinema: false,
  phaseList: []
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
    case 'DELETE_LINE':
      {
        return { ...state,
          lines: [...state.lines.slice(0, action.id), ...state.lines.slice(action.id + 1)]
        };
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
    case 'SET_STEP_SIZE':
      {
        return { ...state, motorSteps: { ...state.motorSteps, [action.name]: action.value } };
      }
    case 'CLEAR_ALL':
      {
        return Object.assign({},
          state,
          { lines: [], distancePoints: [], clickCentringPoints: [] }
        );
      }
    case 'SET_INITIAL_STATE':
      {
        return {
          ...state,
          width: action.data.Camera.imageWidth,
          height: action.data.Camera.imageHeight,
          apertureList: action.data.beamInfo.apertureList,
          currentAperture: action.data.beamInfo.currentAperture,
          beamPosition: action.data.beamInfo.position,
          beamShape: action.data.beamInfo.shape,
          beamSize: { x: action.data.beamInfo.size_x, y: action.data.beamInfo.size_y },
          phaseList: action.data.phaseList,
          currentPhase: action.data.currentPhase,
          lines: []
        };
      }
    default:
      return state;
  }
};
