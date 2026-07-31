import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Identifies which action to dispatch when the dialog's Cancel button is
// pressed. A key rather than a function so the store only ever holds
// serializable values - see ABORT_ACTIONS in PleaseWaitDialog for the
// lookup table that maps these back to real thunks.
export type WaitDialogAbortAction = 'cancelControlRequest' | 'stopQueue';

interface ShowWaitDialogPayload {
  abortAction?: WaitDialogAbortAction;
  blocking?: boolean;
  message?: string;
  title: string;
}

const HIDDEN_STATE = { show: false, dialog: null } as const;

// The dialog is either open (holding its content) or closed (nothing at all).

interface DialogState {
  abortAction?: WaitDialogAbortAction;
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
        abortAction,
      } = action.payload;
      return { show: true, dialog: { title, message, blocking, abortAction } };
    },
    hideWaitDialog: (): WaitDialogSliceState => HIDDEN_STATE,
  },
});

export const { showWaitDialog, hideWaitDialog } = waitDialogSlice.actions;

export default waitDialogSlice.reducer;
