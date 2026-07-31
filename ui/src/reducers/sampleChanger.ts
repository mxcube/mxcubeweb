/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type AnyAction } from 'redux';

type SCContentChildState = 'Loaded' | 'Used' | 'Present' | '';

interface SCContentChild {
  name: string;
  status: SCContentChildState;
  id: string;
  selected: boolean;
  children?: SCContentChild;
}

interface SCContents {
  name: string;
  room_temperature_mode?: boolean;
  children: SCContentChild[];
}

interface SCLoadedSample {
  address: string;
  barcode: string;
}

interface WellOption {
  color: string;
}

interface PlateGrid {
  wellHeight: number;
  wellWidth: number;
  dropHeight: number;
  dropWidth: number;
  rowTitle: string[];
  colTitle: number[];
  numberOfDrops: number;
  type: string;
  title: string;
  wellOption: WellOption[];
  rotation: number;
}

type SampleChangerHWOState =
  | 'Ready'
  | 'Loaded'
  | 'Alarm'
  | 'Charging'
  | 'Disabled'
  | 'Fault'
  | 'Loading'
  | 'Resetting'
  | 'Scanning'
  | 'Selecting'
  | 'Unloading'
  | 'Moving'
  | 'Changing Mode'
  | 'StandBy'
  | 'Initializing'
  | 'Closing';

interface SampleChanger {
  contents: SCContents | null;
  currentPlateIndex: number;
  loadedSample: SCLoadedSample | null;
  plateGrid: PlateGrid[];
  selectedCol: number | null;
  selectedDrop: number | null;
  selectedRow: string | null;
  state: SampleChangerHWOState;
}

const PLATE_GRID_DEFAULTS: PlateGrid = {
  wellHeight: 25,
  wellWidth: 25,
  dropHeight: 25,
  dropWidth: 25,
  rowTitle: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  colTitle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  numberOfDrops: 3,
  type: 'square',
  title: '96 Deep Well Plate',
  wellOption: [{ color: '#eeeeee' }, { color: '#e0e0e0' }],
  rotation: 0,
};

function createPlateGrid(overrides: Partial<PlateGrid> = {}): PlateGrid {
  return { ...PLATE_GRID_DEFAULTS, ...overrides };
}

export const crystalDirect: PlateGrid = createPlateGrid();
export const crystalQUickX: PlateGrid = createPlateGrid({ numberOfDrops: 2 });
export const mitegenInSitu1: PlateGrid = createPlateGrid({ rotation: -90 });
export const greinerImpact1536: PlateGrid = createPlateGrid({
  numberOfDrops: 1,
  wellOption: [{ color: '#eeeeee' }],
});
export const chipX: PlateGrid = createPlateGrid({
  wellHeight: 130,
  wellWidth: 400,
  dropHeight: 20,
  dropWidth: 20,
  rowTitle: ['A', 'B'],
  colTitle: [1],
  numberOfDrops: 20,
  wellOption: [{ color: '#eeeeee' }],
});

export const PLATE_LABEL_TO_GRID = {
  'Crystal Direct': crystalDirect,
  'Crystal QuickX': crystalQUickX,
  'Mitegen InSitu-1': mitegenInSitu1,
  'Greiner Impact 1536': greinerImpact1536,
  ChipX: chipX,
};

const initialState: SampleChanger = {
  contents: null,
  state: 'Ready',
  loadedSample: null,
  plateGrid: [
    crystalDirect,
    crystalQUickX,
    mitegenInSitu1,
    greinerImpact1536,
    chipX,
  ],
  currentPlateIndex: 4,
  selectedRow: null,
  selectedCol: null,
  selectedDrop: null,
};

interface SelectedWell {
  row: string;
  col: number;
}

interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: {
    sampleChanger: {
      state: SampleChangerHWOState;
      contents: SCContents;
      loadedSample: SCLoadedSample;
    };
  };
}

const SampleChangerSlice = createSlice({
  name: 'sampleChanger',
  initialState,
  reducers: {
    setContents(state, action: PayloadAction<SCContents>) {
      state.contents = action.payload;
    },
    setLoadedSample(state, action: PayloadAction<SCLoadedSample>) {
      state.loadedSample = action.payload;
    },
    setState(state, action: PayloadAction<SampleChangerHWOState>) {
      state.state = action.payload;
    },
    setCurrentPlate(state, action: PayloadAction<number>) {
      state.currentPlateIndex = action.payload;
    },
    setSelectedWell(state, action: PayloadAction<SelectedWell>) {
      const { row, col } = action.payload;
      state.selectedRow = row;
      state.selectedCol = col;
    },
    setSelectedDrop(state, action: PayloadAction<number>) {
      state.selectedDrop = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      (action: AnyAction): action is SetInitialStateAction =>
        action.type === 'SET_INITIAL_STATE',
      (state, action) => {
        state.state = action.data.sampleChanger.state;
        state.contents = action.data.sampleChanger.contents;
        state.loadedSample = action.data.sampleChanger.loadedSample;
      },
    );
  },
});

export const {
  setContents,
  setLoadedSample,
  setState,
  setCurrentPlate,
  setSelectedWell,
  setSelectedDrop,
} = SampleChangerSlice.actions;

export default SampleChangerSlice.reducer;
