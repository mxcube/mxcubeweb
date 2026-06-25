import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ContextMenuState {
  show: boolean;
  shape: { type: string };
  pageX: number;
  pageY: number;
  sampleViewX: number;
  sampleViewY: number;
  genericContextMenu: {
    id: string;
    show: boolean;
    x: number;
    y: number;
  };
}

const INITIAL_STATE = {
  show: false,
  shape: { type: 'NONE' },
  pageX: 0,
  pageY: 0,
  sampleViewX: 0,
  sampleViewY: 0,
  genericContextMenu: {
    id: '',
    show: false,
    x: 0,
    y: 0,
  },
} satisfies ContextMenuState as ContextMenuState;

const contextMenuSlice = createSlice({
  name: 'contextMenu',
  initialState: INITIAL_STATE,
  reducers: {
    showContextMenu(
      state,
      action: PayloadAction<{
        show: boolean;
        shape: { type: string };
        pageX: number;
        pageY: number;
        sampleViewX: number;
        sampleViewY: number;
      }>,
    ) {
      return {
        ...state,
        show: action.payload.show,
        shape: action.payload.shape,
        pageX: action.payload.pageX,
        pageY: action.payload.pageY,
        sampleViewX: action.payload.sampleViewX,
        sampleViewY: action.payload.sampleViewY,
      };
    },
    showGenericContextMenu(
      state,
      action: PayloadAction<{
        id: string;
        show: boolean;
        x: number;
        y: number;
      }>,
    ) {
      const genericContextMenu = {
        ...state.genericContextMenu,
        id: action.payload.id,
        show: action.payload.show,
        x: action.payload.x,
        y: action.payload.y,
      };

      return { ...state, genericContextMenu };
    },
  },
});

export const { showContextMenu, showGenericContextMenu } =
  contextMenuSlice.actions;

export default contextMenuSlice.reducer;
