const INITIAL_STATE = { contents: {}, state: 'READY' };

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_SC_CONTENTS':
    case 'SET_INITIAL_STATUS': {
      return { ...state, contents: action.data.sampleChangerContents };
    }
    case 'SET_SC_STATE': {
      return { ...state, state: action.state };
    }
    default: {
      return state;
    }
  }
};
