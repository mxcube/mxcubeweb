const initialState = {
  current: -1,
  info: {}
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_MACH_INFO':
      {
        return { ...state,
                 current: action.info.current,
                 info: action.info,
               };
      }
    default:
      return state;
  }
};
