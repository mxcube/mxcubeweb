/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Point2D {
  x: number;
  y: number;
}

interface ImageMeta {
  width: number;
  height: number;
  pixelsPerMm: [number, number];
  sourceScale: number;
}

interface BeamInfo {
  position: [number, number];
  size_x: number;
  size_y: number;
  shape: string;
  currentAperture: string;
}

interface VideoOverlayState {
  show: boolean;
  msg: string;
}

// Dispatched from actions/login.js and handled by several other reducers too,
// so it isn't owned by this slice.
interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: {
    camera: {
      imageWidth: number;
      imageHeight: number;
      format: 'MJPEG' | 'MPEG1';
      videoSizes: [number, number][];
      sourceIsScalable: boolean;
      videoHash: string;
      videoURL: string;
      pixelsPerMm: [number, number];
      scale: number;
    };
    beamInfo: {
      apertureList: string[];
      currentAperture: string;
      position: [number, number];
      shape: string;
      size_x: number;
      size_y: number;
    };
    diffractometer: {
      phaseList: string[];
      currentPhase: string;
    };
  };
}

interface SampleViewState {
  clickCentring: boolean;
  clickCentringClicksLeft: number;
  measureDistance: boolean;
  distancePoints: Point2D[];
  width: number;
  height: number;
  videoFormat: 'MJPEG' | 'MPEG1';
  videoHash: string;
  videoURL: string;
  sourceIsScalable: boolean;
  videoSizes: [number, number][];
  imageRatio: number;
  pixelsPerMm: [number, number];
  sourceScale: number;
  apertureList: string[];
  currentAperture: string;
  currentPhase: string;
  beamPosition: [number, number];
  beamShape: string;
  beamSize: Point2D;
  phaseList: string[];
  drawGrid: boolean;
  videoMessageOverlay: VideoOverlayState;
}

const INITIAL_STATE: SampleViewState = {
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
  currentAperture: '',
  currentPhase: '',
  beamPosition: [0, 0],
  beamShape: 'ellipse',
  beamSize: { x: 0, y: 0 },
  phaseList: [],
  drawGrid: false,
  videoMessageOverlay: { show: false, msg: '' },
};

const sampleViewSlice = createSlice({
  name: 'sampleView',
  initialState: INITIAL_STATE,
  reducers: {
    setPixelsPerMm(state, action: PayloadAction<[number, number]>) {
      state.pixelsPerMm = action.payload;
    },
    startClickCentring(state) {
      state.clickCentring = true;
    },
    stopClickCentring(state) {
      state.clickCentring = false;
    },
    drawGrid(state) {
      state.drawGrid = !state.drawGrid;
    },
    measureDistance(state, action: PayloadAction<boolean>) {
      state.measureDistance = action.payload;
      state.distancePoints = [];
    },
    addDistancePoint(state, action: PayloadAction<Point2D>) {
      if (state.distancePoints.length === 2) {
        state.measureDistance = false;
        state.distancePoints = [];
      } else {
        state.distancePoints.push(action.payload);
      }
    },
    saveImageSize(state, action: PayloadAction<ImageMeta>) {
      state.height = action.payload.height;
      state.width = action.payload.width;
      state.sourceScale = action.payload.sourceScale;
      state.pixelsPerMm = action.payload.pixelsPerMm;
    },
    centringClicksLeft(state, action: PayloadAction<number>) {
      state.clickCentringClicksLeft = action.payload;
    },
    setImageRatio(state, action: PayloadAction<number>) {
      state.imageRatio = action.payload / state.width;
    },
    setAperture(state, action: PayloadAction<string>) {
      state.currentAperture = action.payload;
    },
    setBeamInfo(state, action: PayloadAction<BeamInfo>) {
      state.beamPosition = action.payload.position;
      state.beamShape = action.payload.shape;
      state.beamSize = {
        x: action.payload.size_x,
        y: action.payload.size_y,
      };
      state.currentAperture = action.payload.currentAperture;
    },
    setCurrentPhase(state, action: PayloadAction<string>) {
      state.currentPhase = action.payload;
    },
    showVideoMessageOverlay(state, action: PayloadAction<VideoOverlayState>) {
      state.videoMessageOverlay = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('SET_CURRENT_SAMPLE', (state) => {
        state.distancePoints = [];
      })
      .addCase('CLEAR_QUEUE', (state) => {
        state.distancePoints = [];
      })
      .addCase('SET_INITIAL_STATE', (state, action: SetInitialStateAction) => {
        const { camera, beamInfo, diffractometer } = action.data;
        state.width = camera.imageWidth;
        state.height = camera.imageHeight;
        state.videoFormat = camera.format;
        state.videoSizes = camera.videoSizes;
        state.sourceIsScalable = camera.sourceIsScalable;
        state.videoHash = camera.videoHash;
        state.videoURL = camera.videoURL;
        state.apertureList = beamInfo.apertureList;
        state.currentAperture = beamInfo.currentAperture;
        state.beamPosition = beamInfo.position;
        state.beamShape = beamInfo.shape;
        state.beamSize = { x: beamInfo.size_x, y: beamInfo.size_y };
        state.phaseList = diffractometer.phaseList;
        state.currentPhase = diffractometer.currentPhase;
        state.pixelsPerMm = camera.pixelsPerMm;
        state.sourceScale = camera.scale;
      });
  },
});

export const {
  setPixelsPerMm,
  startClickCentring,
  stopClickCentring,
  drawGrid,
  measureDistance,
  addDistancePoint,
  saveImageSize,
  centringClicksLeft,
  setImageRatio,
  setAperture,
  setBeamInfo,
  setCurrentPhase,
  showVideoMessageOverlay,
} = sampleViewSlice.actions;

export default sampleViewSlice.reducer;
