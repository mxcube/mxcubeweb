import { REHYDRATE } from 'redux-persist/constants';

const initialState = {
  clickCentring: false,
  clickCentringPoints: [],
  clickCentringClicksLeft: -1,
  measureDistance: false,
  distancePoints: [],
  width: 659,
  height: 493,
  videoFormat: 'MJPEG',
  sourceIsScalable: false,
  videoSizes: [],
  autoScale: true,
  imageRatio: 0,
  pixelsPerMm: [0, 0],
  sourceScale: 1,
  motorSteps: {
    focusStep: 0.01,
    phiStep: 90,
    phiyStep: 0.1,
    phizStep: 0.1,
    sampxStep: 0.1,
    sampyStep: 0.1,
    kappaStep: 0.1,
    kappaphiStep: 0.1,
    sample_verticalStep: 0.1,
    sample_horizontalStep: 0.1
  },
  apertureList: [],
  currentAperture: 0,
  currentPhase: '',
  beamPosition: [0, 0],
  beamShape: 'elipse',
  beamSize: { x: 0, y: 0 },
  cinema: false,
  phaseList: [],
  drawGrid: false,
  videoMessageOverlay: { show: false, msg: '' },
  savedPointId: '',
  selectedShapes: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'TOOGLE_CINEMA':
      {
        return { ...state, cinema: !state.cinema };
      }
    case 'SET_PIXELS_PER_MM':
      {
        return { ...state, pixelsPerMm: action.pixelsPerMm };
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
    case 'DRAW_GRID':
      {
        let selectedGrids = state.selectedGrids;
        if (!state.drawGrid) { selectedGrids = []; }

        return { ...state, drawGrid: !state.drawGrid, selectedGrids };
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
    case 'SAVE_IMAGE_SIZE':
      {
        return {
          ...state,
          width: action.width,
          height: action.height,
          pixelsPerMm: action.pixelsPerMm,
          beamPosition: action.beamPosition,
          sourceScale: action.sourceScale
        };
      }
    case 'CENTRING_CLICKS_LEFT': {
      return { ...state, clickCentringClicksLeft: action.clicksLeft };
    }
    case 'SET_IMAGE_RATIO':
      {
        return { ...state, imageRatio: action.clientWidth / state.width };
      }
    case 'SET_VIDEO_SIZE':
      {
        return { ...state, videoSize: action.width };
      }
    case 'TOGGLE_AUTO_SCALE':
      {
        const imageRatio = state.autoScale ? 1 : action.width / state.width;
        return { ...state, autoScale: !state.autoScale, imageRatio };
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
          beamSize: { x: action.info.size_x, y: action.info.size_y },
          currentAperture: action.info.size_x * 1000
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
    case 'SHOW_VIDEO_MESSAGE_OVERLAY':
      {
        return { ...state, videoMessageOverlay: { show: action.show, msg: action.msg } };
      }
    case 'SET_CENTRING_METHOD':
      {
        return { ...state, centringMethod: action.centringMethod };
      }
    case 'UPDATE_SHAPES':
      {
        let selectedShapes = [...state.selectedShapes];

        action.shapes.forEach((shape) => {
          // Shape was selected, or shape was de-selected, add or remove to selectedShapes
          if (shape.selected && !state.selectedShapes.includes(shape.id)) {
            selectedShapes.push(shape.id);
          } else if (!shape.selected && state.selectedShapes.includes(shape.id)) {
            selectedShapes = selectedShapes.filter((id) => (id !== shape.id));
          }
        });

        return { ...state, selectedShapes };
      }
    case 'DELETE_SHAPE':
      {
        const selectedShapes = state.selectedShapes.filter((id) => (id !== action.id));
        return { ...state, selectedShapes };
      }
    case 'CLEAR_ALL':
      {
        return Object.assign({}, state,
                             { distancePoints: [],
                               clickCentringPoints: [],
                               gridList: [],
                               gridCount: 0,
                               selectedShapes: []
                              }
         );
      }
    case 'SET_CURRENT_SAMPLE':
      {
        return Object.assign({}, state,
                             { distancePoints: [],
                               clickCentringPoints: [],
                               gridList: [],
                               gridCount: 0,
                               selectedShapes: []
                              }
         );
      }
    case 'CLEAR_QUEUE':
      {
        return Object.assign({}, state,
                             { distancePoints: [],
                               clickCentringPoints: [],
                               gridList: [],
                               gridCount: 0 }
         );
      }
    case REHYDRATE:
      {
        return {
          ...action.payload.sampleview,
          ...state,
        };
      }
    case 'SET_INITIAL_STATE':
      {
        return {
          ...state,
          width: action.data.Camera.imageWidth,
          height: action.data.Camera.imageHeight,
          videoFormat: action.data.Camera.format,
          videoSizes: action.data.Camera.videoSizes,
          sourceIsScalable: action.data.Camera.sourceIsScalable,
          apertureList: action.data.beamInfo.apertureList,
          currentAperture: action.data.beamInfo.currentAperture,
          beamPosition: action.data.beamInfo.position,
          beamShape: action.data.beamInfo.shape,
          beamSize: { x: action.data.beamInfo.size_x, y: action.data.beamInfo.size_y },
          phaseList: action.data.phaseList,
          currentPhase: action.data.currentPhase,
          pixelsPerMm: action.data.Camera.pixelsPerMm,
          sourceScale: action.data.Camera.scale
        };
      }
    default:
      return state;
  }
};
