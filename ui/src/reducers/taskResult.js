const INITIAL_STATE = {
  energyScan: [],
};

function taskResultReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_ENERGY_SCAN_RESULT': {
      const results = state.energyScan;
      results.push({
        pk: [`PK ${action.pk}`, action.pk],
        ip: [`IP ${action.ip}`, action.ip],
        rm: [`RM ${action.rm}`, action.rm],
      });
      return { ...state, energyScan: results };
    }
    case 'SET_INITIAL_STATE': {
      return { ...INITIAL_STATE };
    }
    default:
      return state;
  }
}

export default taskResultReducer;
