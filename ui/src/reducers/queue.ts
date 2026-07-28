/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { clearAllLastUsedParameters } from '../components/Tasks/fields';
import {
  CENTRING_METHOD,
  type CentringMethod,
  QUEUE_STOPPED,
  type QueueStatus,
} from '../constants';

type QueueSettingName = 'rememberParametersBetweenSamples' | 'autoAddDiffplan';

interface SetQueueAction {
  type: 'SET_QUEUE';
  sampleOrder: string[];
}

interface SetCurrentSampleAction {
  type: 'SET_CURRENT_SAMPLE';
  sampleID: string;
}

interface RemoveSamplesFromQueueAction {
  type: 'REMOVE_SAMPLES_FROM_QUEUE';
  sampleIDList: string[];
}

interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: {
    queue: QueueSliceState;
  };
}

interface QueueSliceState {
  autoAddDiffplan: boolean;
  autoMountNext: boolean;
  centringMethod: CentringMethod;
  current: string;
  groupFolder: string;
  numSnapshots: number;
  queue: string[];
  queueStatus: QueueStatus;
  rememberParametersBetweenSamples: boolean;
}

const INITIAL_STATE: QueueSliceState = {
  autoAddDiffplan: false,
  autoMountNext: false,
  centringMethod: CENTRING_METHOD.MANUAL,
  current: '',
  groupFolder: '',
  numSnapshots: 4,
  queue: [],
  queueStatus: QUEUE_STOPPED,
  rememberParametersBetweenSamples: true,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState: INITIAL_STATE,
  reducers: {
    setStatus(state, action: PayloadAction<QueueStatus>) {
      state.queueStatus = action.payload;
    },
    clearCurrentSample(state) {
      state.queue = state.queue.filter(
        (sampleID) => sampleID !== state.current,
      );
      state.current = '';
    },
    setAutoMount(state, action: PayloadAction<boolean>) {
      state.autoMountNext = action.payload;
    },
    setAutoAddDiffPlan(state, action: PayloadAction<boolean>) {
      state.autoAddDiffplan = action.payload;
    },
    setCentringMethod(state, action: PayloadAction<CentringMethod>) {
      state.centringMethod = action.payload;
    },
    setNumSnapshots(state, action: PayloadAction<number>) {
      state.numSnapshots = action.payload;
    },
    setGroupFolder(state, action: PayloadAction<string>) {
      state.groupFolder = action.payload;
    },
    setQueueSetting(
      state,
      action: PayloadAction<{ settingName: QueueSettingName; value: boolean }>,
    ) {
      state[action.payload.settingName] = action.payload.value;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('SET_QUEUE', (state, action: SetQueueAction) => {
        state.queue = action.sampleOrder;
      })
      .addCase('CLEAR_QUEUE', (state) => {
        state.queue = [];
        state.current = '';
      })
      .addCase(
        'REMOVE_SAMPLES_FROM_QUEUE',
        (state, action: RemoveSamplesFromQueueAction) => {
          state.queue = state.queue.filter(
            (sampleID) => !action.sampleIDList.includes(sampleID),
          );
        },
      )
      .addCase(
        'SET_CURRENT_SAMPLE',
        (state, action: SetCurrentSampleAction) => {
          if (!state.rememberParametersBetweenSamples) {
            clearAllLastUsedParameters();
          }

          state.current = action.sampleID;
        },
      )
      .addCase('SET_INITIAL_STATE', (state, action: SetInitialStateAction) => {
        const { queue } = action.data;
        state.queue = queue.queue;
        state.groupFolder = queue.groupFolder;
        state.autoMountNext = queue.autoMountNext;
        state.autoAddDiffplan = queue.autoAddDiffplan;
        state.numSnapshots = queue.numSnapshots;
        state.centringMethod = queue.centringMethod;
        state.rememberParametersBetweenSamples =
          queue.rememberParametersBetweenSamples;
        state.current = queue.current;
        state.queueStatus = queue.queueStatus;
      });
  },
});

export const {
  setStatus,
  clearCurrentSample,
  setAutoMount,
  setAutoAddDiffPlan,
  setCentringMethod,
  setNumSnapshots,
  setGroupFolder,
  setQueueSetting,
} = queueSlice.actions;

export default queueSlice.reducer;
