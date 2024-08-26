const INITIAL_STATE = {
  // the null value is used to distinguish between signed out (null) or logged in (true/false)
  sid: null,
  observers: [],
  allowRemote: false,
  timeoutGivesControl: false,
  chatMessageCount: 0,
};

function remoteAccessReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_RA_STATE': {
      return {
        ...state,
        observers: action.data.observers,
        allowRemote: action.data.allowRemote,
        timeoutGivesControl: action.data.timeoutGivesControl,
      };
    }
    case 'SET_MASTER': {
      return { ...state, sid: action.sid };
    }
    case 'SET_OBSERVERS': {
      return { ...state, observers: action.observers };
    }
    case 'SET_ALLOW_REMOTE': {
      return { ...state, allowRemote: action.allow };
    }
    case 'SET_TIMEOUT_GIVES_CONTROL': {
      return { ...state, timeoutGivesControl: action.timeoutGivesControl };
    }
    case 'RESET_CHAT_MESSAGE_COUNT': {
      return { ...state, chatMessageCount: 0 };
    }
    case 'INC_CHAT_MESSAGE_COUNT': {
      return {
        ...state,
        chatMessageCount: state.chatMessageCount + action.count,
      };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        observers: action.data.remoteAccess.observers,
        sid: action.data.remoteAccess.sid,
        allowRemote: action.data.remoteAccess.allowRemote,
        timeoutGivesControl: action.data.remoteAccess.timeoutGivesControl,
      };
    }
    default: {
      return state;
    }
  }
}

export default remoteAccessReducer;
