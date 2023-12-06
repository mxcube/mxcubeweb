const INITIAL_STATE = {
  global_state: {},
  commands: {},
  commands_state: {},
  message: '',
};

function harvesterMaintenanceReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        commands: action.data.harvesterCommands,
        global_state: action.data.harvesterGlobalState.global_state,
        commands_state: action.data.harvesterGlobalState.commands_state,
        message: action.data.harvesterGlobalState.message,
      };
    }
    case 'SET_HARVESTER_GLOBAL_STATE': {
      return {
        ...state,
        global_state: JSON.parse(action.data.state),
        commands_state: JSON.parse(action.data.commands_state),
        message: action.data.message,
      };
    }
    default: {
      return state;
    }
  }
}

export default harvesterMaintenanceReducer;
