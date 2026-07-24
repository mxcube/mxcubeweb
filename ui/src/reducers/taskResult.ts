import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface EnergyScanValues {
  pk: number;
  ip: number;
  rm: number;
}

// Each value is paired with a display label for the energy-scan result select.
type LabelledEnergy = [label: string, energy: number];

interface EnergyScanResult {
  pk: LabelledEnergy;
  ip: LabelledEnergy;
  rm: LabelledEnergy;
}

interface TaskResultState {
  energyScan: EnergyScanResult[];
}

const INITIAL_STATE: TaskResultState = {
  energyScan: [],
};

const taskResultSlice = createSlice({
  name: 'taskResult',
  initialState: INITIAL_STATE,
  reducers: {
    setEnergyScanResult(state, action: PayloadAction<EnergyScanValues>) {
      const { pk, ip, rm } = action.payload;
      state.energyScan.push({
        pk: [`PK ${pk}`, pk],
        ip: [`IP ${ip}`, ip],
        rm: [`RM ${rm}`, rm],
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase('SET_INITIAL_STATE', () => INITIAL_STATE);
  },
});

export const { setEnergyScanResult } = taskResultSlice.actions;

export default taskResultSlice.reducer;
