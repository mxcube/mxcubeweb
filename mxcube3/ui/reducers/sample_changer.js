const INITIAL_STATE = { contents: {} };

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_INITIAL_STATUS': {
      return Object.assign({}, state, { contents: action.data.sampleChangerContents });
    }
    default: {
      return state;
    }
  }
};
