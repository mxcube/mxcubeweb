import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Shape {
  type: string;
}

interface NoMenu {
  type: 'None';
}

interface ShapeMenu {
  type: 'Shape';
  shape: Shape;
  pageX: number;
  pageY: number;
  sampleViewX: number;
  sampleViewY: number;
}

interface GenericMenu {
  type: 'Generic';
  id: string;
  x: number;
  y: number;
}

type ContextMenuState = NoMenu | ShapeMenu | GenericMenu;

const contextMenuSlice = createSlice({
  name: 'contextMenu',
  initialState: (): ContextMenuState => ({ type: 'None' }),
  reducers: {
    showShapeMenu(
      _state,
      action: PayloadAction<Omit<ShapeMenu, 'type'>>,
    ): ContextMenuState {
      return { type: 'Shape', ...action.payload };
    },
    showGenericMenu(
      _state,
      action: PayloadAction<Omit<GenericMenu, 'type'>>,
    ): ContextMenuState {
      return { type: 'Generic', ...action.payload };
    },
    hideMenu(): ContextMenuState {
      return { type: 'None' };
    },
  },
});

export const { showShapeMenu, showGenericMenu, hideMenu } =
  contextMenuSlice.actions;

export default contextMenuSlice.reducer;
