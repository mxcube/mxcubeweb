const initialState = {
  // the null value is used to distinguish between signed out (null) or logged in (true/false)
  sid: null,
  observers: [],
  allowRemote: false,
  timeoutGivesControl: false,
  showObserverDialog: false,
  chatMessageCount: 0
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_RA_STATE':
    {
      return {
        ...state,
        observers: action.data.observers,
        allowRemote: action.data.allowRemote,
        timeoutGivesControl: action.data.timeoutGivesControl
      };
    }
    case 'SET_MASTER':
    {
      return Object.assign({}, state,
        {
          sid: action.sid
        });
    }
    case 'SET_OBSERVERS':
    {
      return Object.assign({}, state, { observers: action.observers });
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
    case 'SET_INITIAL_STATE':
    {
      return {
        ...state,
        observers: action.data.remoteAccess.observers,
        sid: action.data.remoteAccess.sid,
        allowRemote: action.data.remoteAccess.allowRemote,
        timeoutGivesControl: action.data.remoteAccess.timeoutGivesControl
      };
    }
    default:
      return state;
  }
};
