/* eslint-disable no-param-reassign */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Shape {
  type: string;
}

interface GenericContextMenu {
  id: string;
  show: boolean;
  x: number;
  y: number;
}
interface ContextMenuState {
  show: boolean;
  shape: Shape;
  pageX: number;
  pageY: number;
  sampleViewX: number;
  sampleViewY: number;
  genericContextMenu: GenericContextMenu;
}

const INITIAL_STATE: ContextMenuState = {
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
};

const contextMenuSlice = createSlice({
  name: 'contextMenu',
  initialState: INITIAL_STATE,
  reducers: {
    showContextMenu(
      state,
      action: PayloadAction<{
        show: boolean;
        shape: Shape;
        pageX: number;
        pageY: number;
        sampleViewX: number;
        sampleViewY: number;
      }>,
    ) {
      state.show = action.payload.show;
      state.shape = action.payload.shape;
      state.pageX = action.payload.pageX;
      state.pageY = action.payload.pageY;
      state.sampleViewX = action.payload.sampleViewX;
      state.sampleViewY = action.payload.sampleViewY;
    },
    showGenericContextMenu(state, action: PayloadAction<GenericContextMenu>) {
      state.genericContextMenu = action.payload;
    },
  },
});

export const { showContextMenu, showGenericContextMenu } =
  contextMenuSlice.actions;

export default contextMenuSlice.reducer;
