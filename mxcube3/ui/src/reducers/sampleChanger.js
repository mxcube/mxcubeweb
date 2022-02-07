const INITIAL_STATE = { contents: {}, state: 'READY', loadedSample: {} };

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_SC_CONTENTS': {
      return { ...state, contents: action.data.sampleChangerContents };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        state: action.data.sampleChangerState.state,
        contents: action.data.sampleChangerContents,
        loadedSample: action.data.loadedSample,
      };
    }
    case 'SET_LOADED_SAMPLE': {
      return {
        ...state,
        loadedSample: action.data
      };
    }
    case 'SET_SC_STATE': {
      return { ...state, state: action.state };
    }
    case 'SET_SC_GLOBAL_STATE': {
      return {
        ...state,
        state: JSON.parse(action.data.state).state
      };
    }
    default: {
      return state;
    }
  }
};
