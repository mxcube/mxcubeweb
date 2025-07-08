const INITIAL_STATE = {
  logRecords: [],
};

function loggerReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'ADD_LOG_RECORD': {
      return {
        ...state,
        logRecords: [...state.logRecords.slice(-100), action.data],
      };
    }
    case 'SET_INITIAL_STATE': {
      return { ...state, logRecords: [...action.data.logger.return] };
    }
    default: {
      return state;
    }
  }
}

export default loggerReducer;
