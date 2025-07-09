const INITIAL_STATE = {
  show: false,
  title: undefined,
  message: undefined,
  blocking: false,
  abortFun: undefined, // not serializable! https://redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions
};

function waitDialogReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SHOW_WAIT_DIALOG': {
      return {
        ...state,
        show: true,
        title: action.title,
        message: action.message,
        blocking: action.blocking,
        abortFun: action.abortFun,
      };
    }
    case 'HIDE_WAIT_DIALOG': {
      return {
        ...state, // keep title and message while dialog is hiding
        show: false,
        blocking: false,
        abortFun: undefined,
      };
    }
    default: {
      return state;
    }
  }
}

export default waitDialogReducer;
