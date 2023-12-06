const INITIAL_STATE = { contents: {}, state: 'READY' };

function harvesterReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_HARVESTER_CONTENTS': {
      return { ...state, contents: action.data.harvesterContents };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        state: action.data.harvesterState.state,
        contents: action.data.harvesterContents,
      };
    }
    case 'SET_HARVESTER_STATE': {
      return { ...state, state: action.state };
    }
    default: {
      return state;
    }
  }
}

export default harvesterReducer;
