const INITIAL_STATE = {
  clickCentring: false,
  clickCentringClicksLeft: -1,
  measureDistance: false,
  distancePoints: [],
  width: 659,
  height: 493,
  videoFormat: 'MJPEG',
  videoHash: '',
  videoURL: '',
  sourceIsScalable: false,
  videoSizes: [],
  imageRatio: 0,
  pixelsPerMm: [0, 0],
  sourceScale: 1,
  apertureList: [],
  currentAperture: 0,
  currentPhase: '',
  beamPosition: [0, 0],
  beamShape: 'ellipse',
  beamSize: { x: 0, y: 0 },
  phaseList: [],
  drawGrid: false,
  videoMessageOverlay: { show: false, msg: '' },
  savedPointId: '',
  selectedShapes: [],
};

// eslint-disable-next-line complexity
function sampleViewReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_PIXELS_PER_MM': {
      return { ...state, pixelsPerMm: action.pixelsPerMm };
    }
    case 'START_CLICK_CENTRING': {
      return { ...state, clickCentring: true };
    }
    case 'STOP_CLICK_CENTRING': {
      return { ...state, clickCentring: false };
    }
    case 'CLEAR_SELECTED_SHAPES': {
      return { ...state, selectedShapes: [] };
    }
    case 'DRAW_GRID': {
      let { selectedGrids } = state;
      if (!state.drawGrid) {
        selectedGrids = [];
      }

      return { ...state, drawGrid: !state.drawGrid, selectedGrids };
    }
    case 'MEASURE_DISTANCE': {
      return { ...state, measureDistance: action.mode, distancePoints: [] };
    }
    case 'ADD_DISTANCE_POINT': {
      return state.distancePoints.length === 2
        ? { ...state, measureDistance: false, distancePoints: [] }
        : {
            ...state,
            distancePoints: [
              ...state.distancePoints,
              { x: action.x, y: action.y },
            ],
          };
    }
    case 'SAVE_IMAGE_SIZE': {
      return {
        ...state,
        width: action.width,
        height: action.height,
        pixelsPerMm: action.pixelsPerMm,
        sourceScale: action.sourceScale,
      };
    }
    case 'CENTRING_CLICKS_LEFT': {
      return { ...state, clickCentringClicksLeft: action.clicksLeft };
    }
    case 'SET_IMAGE_RATIO': {
      return { ...state, imageRatio: action.clientWidth / state.width };
    }
    case 'SET_APERTURE': {
      return { ...state, currentAperture: action.size };
    }
    case 'SET_BEAM_INFO': {
      return {
        ...state,
        beamPosition: action.info.position,
        beamShape: action.info.shape,
        beamSize: { x: action.info.size_x, y: action.info.size_y },
        currentAperture: action.info.currentAperture,
      };
    }
    case 'SET_CURRENT_PHASE': {
      return { ...state, currentPhase: action.phase };
    }
    case 'SHOW_VIDEO_MESSAGE_OVERLAY': {
      return {
        ...state,
        videoMessageOverlay: { show: action.show, msg: action.msg },
      };
    }
    case 'UPDATE_SHAPES': {
      let selectedShapes = [...state.selectedShapes];

      action.shapes.forEach((shape) => {
        // Shape was selected, or shape was de-selected, add or remove to selectedShapes
        if (shape.selected && !state.selectedShapes.includes(shape.id)) {
          selectedShapes.push(shape.id);
        } else if (!shape.selected && state.selectedShapes.includes(shape.id)) {
          selectedShapes = selectedShapes.filter((id) => id !== shape.id);
        }
      });

      return { ...state, selectedShapes };
    }
    case 'DELETE_SHAPE': {
      const selectedShapes = state.selectedShapes.filter(
        (id) => id !== action.id,
      );
      return { ...state, selectedShapes };
    }
    case 'SET_CURRENT_SAMPLE': {
      return {
        ...state,
        distancePoints: [],
        gridList: [],
        gridCount: 0,
        selectedShapes: [],
      };
    }
    case 'CLEAR_QUEUE': {
      return {
        ...state,
        distancePoints: [],
        gridList: [],
        gridCount: 0,
      };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        width: action.data.camera.imageWidth,
        height: action.data.camera.imageHeight,
        videoFormat: action.data.camera.format,
        videoSizes: action.data.camera.videoSizes,
        sourceIsScalable: action.data.camera.sourceIsScalable,
        videoHash: action.data.camera.videoHash,
        videoURL: action.data.camera.videoURL,
        apertureList: action.data.beamInfo.apertureList,
        currentAperture: action.data.beamInfo.currentAperture,
        beamPosition: action.data.beamInfo.position,
        beamShape: action.data.beamInfo.shape,
        beamSize: {
          x: action.data.beamInfo.size_x,
          y: action.data.beamInfo.size_y,
        },
        phaseList: action.data.diffractometer.phaseList,
        currentPhase: action.data.diffractometer.currentPhase,
        pixelsPerMm: action.data.camera.pixelsPerMm,
        sourceScale: action.data.camera.scale,
      };
    }
    default: {
      return state;
    }
  }
}

export default sampleViewReducer;
