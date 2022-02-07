
const INITIAL_STATE = {
  global_state: {}, commands: {}, commands_state: {}, message: ''
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        commands: action.data.sampleChangerCommands,
        global_state: action.data.sampleChangerGlobalState.state,
        commands_state: action.data.sampleChangerGlobalState.commands_state,
        message: action.data.sampleChangerGlobalState.message,
      };
    }
    case 'SET_SC_GLOBAL_STATE': {
      return {
        ...state,
        global_state: JSON.parse(action.data.state),
        commands_state: JSON.parse(action.data.commands_state),
        message: action.data.message
      };
    }
    default: {
      return state;
    }
  }
};
