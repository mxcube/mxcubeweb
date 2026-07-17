import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type SeverityType = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

export interface LogRecord {
  id: string;
  message: string;
  severity: SeverityType;
  timestamp: string;
}

export interface LogRecordsType {
  logRecords: LogRecord[];
}

interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data?: { logger: { return: LogRecord[] } };
}

const logRecordsSlice = createSlice({
  name: 'logRecord',
  initialState: (): LogRecordsType => ({
    logRecords: [],
  }),
  reducers: {
    addLogRecord(state, action: PayloadAction<LogRecord>) {
      return {
        logRecords: [...state.logRecords.slice(-100), action.payload],
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      'SET_INITIAL_STATE',
      (_state, action: SetInitialStateAction) => {
        return { logRecords: [...(action.data?.logger.return ?? [])] };
      },
    );
  },
});

export const { addLogRecord } = logRecordsSlice.actions;

export default logRecordsSlice.reducer;
