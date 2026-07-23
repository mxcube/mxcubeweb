import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ShowWaitDialogPayload {
  abortFun?: () => void;
  blocking?: boolean;
  message?: string;
  title: string;
}

const HIDDEN_STATE = { show: false, dialog: null } as const;

// The dialog is either open (holding its content) or closed (nothing at all).

interface DialogState {
  abortFun?: () => void;
  blocking: boolean;
  message: string;
  title: string;
}

type WaitDialogSliceState =
  | {
      show: true;
      dialog: DialogState;
    }
  | {
      show: false;
      // we may preserve the dialog state after setting `show` state to false.
      // Closing dialog is done with a "fade-out" animation, which should still
      // contain the dialog contents.
      dialog: DialogState | null;
    };

const waitDialogSlice = createSlice({
  name: 'waitDialog',
  initialState: (): WaitDialogSliceState => HIDDEN_STATE,
  reducers: {
    showWaitDialog: (
      _state,
      action: PayloadAction<ShowWaitDialogPayload>,
    ): WaitDialogSliceState => {
      const {
        title,
        message = '',
        blocking = false,
        abortFun,
      } = action.payload;
      return { show: true, dialog: { title, message, blocking, abortFun } };
    },
    hideWaitDialog: (): WaitDialogSliceState => HIDDEN_STATE,
  },
});

export const { showWaitDialog, hideWaitDialog } = waitDialogSlice.actions;

export default waitDialogSlice.reducer;
