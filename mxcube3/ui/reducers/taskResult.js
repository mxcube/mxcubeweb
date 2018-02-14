const initialState = {
  energyScan: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_ENERGY_SCAN_RESULT':
      {
        const results = state.energyScan;
        results.push({ pk: [`PK ${action.pk}`, action.pk],
                       ip: [`IP ${action.ip}`, action.ip],
                       rm: [`RM ${action.rm}`, action.rm] });
        return Object.assign({}, state, { energyScan: results });
      }
    case 'SET_INITIAL_STATE':
      {
        return { ...initialState };
      }
    default:
      return state;
  }
};
