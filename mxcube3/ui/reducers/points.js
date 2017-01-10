import { omit } from 'lodash/object';

const initialState = {
  points: {},
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_POINTS_POSITION':
      {
        return { ...state, points: action.points };
      }
    case 'SAVE_POINT':
      {
        return { ...state, points: { ...state.points, [action.point.posId]: action.point } };
      }
    case 'SET_CURRENT_SAMPLE':
      {
        return initialState;
      }
    case 'DELETE_POINT':
      {
        return { ...state, points: omit(state.points, action.id) };
      }
    case 'CLEAR_ALL':
      {
        return initialState;
      }
    case 'SET_INITIAL_STATE':
      {
        return {
          ...state,
          points: action.data.points
        };
      }
    default:
      return state;
  }
};
