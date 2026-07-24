/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface WaitDialog {
  show: boolean;
  title: string;
  message: string;
  blocking: boolean;
  abortFun: (() => void) | undefined;
}

const initialState: WaitDialog = {
  show: false,
  title: 'Please wait',
  message: '',
  blocking: false,
  abortFun: undefined, // not serializable! https://redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions
};

const waitDialogSlice = createSlice({
  name: 'waitDialog',
  initialState,
  reducers: {
    showWaitDialog: {
      reducer(
        _state,
        action: PayloadAction<Omit<WaitDialog, 'show'>>,
      ): WaitDialog {
        return {
          show: true,
          title: action.payload.title,
          message: action.payload.message,
          blocking: action.payload.blocking,
          abortFun: action.payload.abortFun,
        };
      },
      prepare(
        title: string,
        message?: string,
        blocking?: boolean,
        abortFun?: () => void,
      ) {
        return {
          payload: {
            title,
            message: message ?? '',
            blocking: blocking ?? false,
            abortFun,
          },
        };
      },
    },
    hideWaitDialog(state) {
      // keep title and message while dialog is hiding
      state.show = false;
      state.blocking = false;
      state.abortFun = undefined;
    },
  },
});

export const { showWaitDialog, hideWaitDialog } = waitDialogSlice.actions;

export default waitDialogSlice.reducer;
