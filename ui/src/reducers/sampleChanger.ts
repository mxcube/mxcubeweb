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
  selectedCol: number | null;
  selectedDrop: number | null;
  selectedRow: string | null;
  state: SampleChangerHWOState;
}

const initialState: SampleChanger = {
  contents: null,
  state: 'Ready',
  loadedSample: null,
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
