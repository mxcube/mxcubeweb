const initialState = {
  master: false,
  sid: null,
  observerName: null,
  requestingControl: false,
  observers: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_MASTER':
      {
        return Object.assign({}, state,
          {
            master: action.master,
            sid: action.sid,
            observerName: action.name,
            requestingControl: false
          });
      }
    case 'SET_OBSERVERS':
      {
        return Object.assign({}, state, { observers: action.observers });
      }
    case 'REQUEST_CONTROL':
      {
        return Object.assign({}, state, { requestingControl: action.control });
      }
    case 'SET_INITIAL_STATE':
      {
        return { ...state,
                 observers: action.data.remoteAccess.observers,
                 master: action.data.remoteAccess.master,
                 observerName: action.data.remoteAccess.observerName,
                 sid: action.data.remoteAccess.sid };
      }
    default:
      return state;
  }
};
