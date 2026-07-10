/* eslint-disable no-param-reassign */

import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export type ShapeState = 'SAVED' | 'TMP' | 'HIDDEN';

interface BaseShape {
  id: string;
  name: string;
  // state which may be set automatically, e.g. shapes are hidden during oscillation.
  state: ShapeState;
  userState: ShapeState; // state set by user, used to recall user preference
  label: string;
  selected: boolean;
  screenCoord: [number, number];
}

export interface PointShape extends BaseShape {
  t: 'P';
  motorPositions: Record<string, number>;
}

export interface TwoDPointShape extends BaseShape {
  t: '2DP';
  motorPositions: Record<string, number>;
}

export interface LineShape extends BaseShape {
  t: 'L';
  // Both endpoints, flattened: [x1, y1, x2, y2].
  refs: [string, string];
  motorPositions: string; // stringified pair of Record<string, number>
}

export type GridCellCountFunction =
  | 'zig-zag'
  | 'inverse-zig-zag'
  | 'top-down'
  | 'top-down-zig-zag';

export interface GridShape extends BaseShape {
  t: 'G';
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  cellHSpace: number;
  cellVSpace: number;
  numCols: number;
  numRows: number;
  cellCountFun: GridCellCountFunction;
  result: string | Record<number, number[]> | null;
  resultDataPath?: string;
  pixelsPerMm: [number, number];
  motorPositions: { omega: number } & Record<string, number>;
  beamPos: [number, number];
  dxMm: number;
  dyMm: number;
  hideThreshold: number;
  stepsX: number;
  stepsY: number;
  angle: number;
  beamHeight: number;
  x1: number;
  y1: number;
}

export type Shape = PointShape | TwoDPointShape | LineShape | GridShape;

export type ShapesById = Record<string, Shape>;

export interface ShapesState {
  shapes: ShapesById;
  overlayLevel?: number;
}

const initialState: ShapesState = {
  shapes: {},
};

// Dispatched from actions/queue.js and actions/login.js respectively, and
// handled by several other reducers too, so they aren't owned by this slice.
interface SetInitialStateAction {
  type: 'SET_INITIAL_STATE';
  data: { shapes: ShapesById };
}

const shapesSlice = createSlice({
  name: 'shapes',
  initialState,
  reducers: {
    setShapes(state, action: PayloadAction<ShapesById>) {
      state.shapes = action.payload;
    },
    addShape(state, action: PayloadAction<Shape>) {
      state.shapes[action.payload.id] = action.payload;
    },
    updateShapes(state, action: PayloadAction<Shape[]>) {
      action.payload.forEach((shape) => {
        state.shapes[shape.id] = shape;
      });
    },
    deleteShape(state, action: PayloadAction<string>) {
      const { [action.payload]: _toRemove, ...shapes } = state.shapes;
      state.shapes = shapes;
    },
    setOverlay(state, action: PayloadAction<number>) {
      state.overlayLevel = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase('SET_CURRENT_SAMPLE', () => initialState)
      .addCase('SET_INITIAL_STATE', (state, action: SetInitialStateAction) => {
        state.shapes = action.data.shapes;
      });
  },
});

export const { setShapes, addShape, updateShapes, deleteShape, setOverlay } =
  shapesSlice.actions;

function selectShapesById(state: { shapes: ShapesState }) {
  return state.shapes.shapes;
}

export const selectSelectedShapeIds = createSelector(
  [selectShapesById],
  (shapesById) =>
    Object.values(shapesById)
      .filter((shape) => shape.selected)
      .map((shape) => shape.id),
);

export default shapesSlice.reducer;
