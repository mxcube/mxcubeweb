import { omit } from 'lodash/object';

const initialState = {
  shapes: {}
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_SHAPE_POSITION':
      {
        return { ...state, shapes: action.shapes };
      }
    case 'ADD_SHAPE':
      {
        return { ...state, shapes: { ...state.shapes, [action.shape.id]: action.shape } };
      }
    case 'UPDATE_SHAPE':
      {
        return { ...state, shapes: { ...state.shapes, [action.shape.id]: action.shape } };
      }
    case 'DELETE_SHAPE':
      {
        return { ...state, shapes: omit(state.shapes, action.id) };
      }
    case 'SET_OVERLAY':
      {
        return { ...state, overlayLevel: action.level };
      }
    case 'SHOW_HEAT_MAP':
      {
        return { ...state, showHeatmap: action.value };
      }
    case 'SET_CURRENT_SAMPLE':
      {
        return initialState;
      }
    case 'CLEAR_ALL':
      {
        return initialState;
      }
    case 'SET_INITIAL_STATE':
      {
        return {
          ...state,
          shapes: action.data.shapes,
        };
      }
    default:
      return state;
  }
};
