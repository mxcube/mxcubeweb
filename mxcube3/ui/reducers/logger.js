const initialState = {
  logRecords: [],
  activePage: 0
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'ADD_LOG_RECORD':
      {
        return { ...state, logRecords: [...state.logRecords, action.data] };
      }
    case 'SET_PAGE_LOGGING':
      {
        return { ...state, activePage: action.page };
      }
    case 'SIGNOUT':
      {
        return Object.assign({}, state, initialState);
      }
    default:
      return state;

  }
};
