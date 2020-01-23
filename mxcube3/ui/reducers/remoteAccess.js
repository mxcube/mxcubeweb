const initialState = {
  // the null value is used to distinguish between signed out (null) or logged in (true/false)
  master: null,
  sid: null,
  observerName: null,
  requestingControl: false,
  allowRemote: false,
  observers: [],
  users: [],
  timeoutGivesControl: false,
  showObserverDialog: false,
  chatMessageCount: 0
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
            requestingControl: false,
          });
      }
    case 'SET_OBSERVERS':
      {
        return Object.assign({}, state, { observers: action.observers });
      }
    case 'SET_USERS':
      {
        return Object.assign({}, state, { users: action.users });
      }
    case 'SHOW_OBSERVER_DIALOG':
      {
        return Object.assign({}, state, { showObserverDialog: action.show });
      }
    case 'SET_ALLOW_REMOTE':
      {
        return Object.assign({}, state, { allowRemote: action.allow });
      }
    case 'SET_TIMEOUT_GIVES_CONTROL':
      {
        return Object.assign({}, state, { timeoutGivesControl: action.timeoutGivesControl });
      }
    case 'RESET_CHAT_MESSAGE_COUNT':
      {
        return Object.assign({}, state, { chatMessageCount: 0 });
      }
    case 'INC_CHAT_MESSAGE_COUNT':
      {
        return Object.assign({}, state, { chatMessageCount: state.chatMessageCount + 1 });
      }
    case 'REQUEST_CONTROL':
      {
        return Object.assign({}, state, { requestingControl: action.control });
      }
    case 'SET_INITIAL_STATE':
      {
        return { ...state,
                 observers: action.data.remoteAccess.observers,
                 users: action.data.remoteAccess.users,
                 master: action.data.remoteAccess.master,
                 observerName: action.data.remoteAccess.observerName,
                 type: action.data.remoteAccess.type,
                 sid: action.data.remoteAccess.sid,
                 allowRemote: action.data.remoteAccess.allowRemote,
                 timeoutGivesControl: action.data.remoteAccess.timeoutGivesControl };
      }
    default:
      return state;
  }
};
