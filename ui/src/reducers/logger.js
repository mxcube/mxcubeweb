const INITIAL_STATE = {
  logRecords: [],
  activePage: 0,
};

function loggerReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'ADD_LOG_RECORD': {
      return { ...state, logRecords: [...state.logRecords, action.data] };
    }
    case 'SET_PAGE_LOGGING': {
      return { ...state, activePage: action.page };
    }
    case 'SET_INITIAL_STATE': {
      return { ...state, logRecords: [...action.data.logger] };
    }
    default: {
      return state;
    }
  }
}

export default loggerReducer;
