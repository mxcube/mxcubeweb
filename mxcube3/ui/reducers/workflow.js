const initialState = {
  workflows: [],
  current: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_WORKFLOWS':
      {
        return Object.assign({}, state, { workflows: { ...action.workflows } });
      }
    case 'SET_CURRENT_WORKFLOW':
      {
        return Object.assign({}, state, { current: action.current });
      }
    case 'SET_INITIAL_STATE':
      {
        return { ...state, workflows: action.data.workflow.workflows };
      }
    default:
      return state;
  }
};
