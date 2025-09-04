import { omit } from 'lodash/object';

const INITIAL_STATE = {
  shapes: {},
};

function shapesReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_SHAPES': {
      return { ...state, shapes: action.shapes };
    }
    case 'ADD_SHAPE': {
      return {
        ...state,
        shapes: { ...state.shapes, [action.shape.id]: action.shape },
      };
    }
    case 'UPDATE_SHAPES': {
      const shapes = { ...state.shapes };

      action.shapes.forEach((shape) => {
        shapes[shape.id] = shape;
      });

      return { ...state, shapes };
    }
    case 'DELETE_SHAPE': {
      return { ...state, shapes: omit(state.shapes, action.id) };
    }
    case 'SET_OVERLAY': {
      return { ...state, overlayLevel: action.level };
    }
    case 'SET_CURRENT_SAMPLE': {
      return INITIAL_STATE;
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        shapes: action.data.shapes,
      };
    }
    default: {
      return state;
    }
  }
}

export default shapesReducer;
