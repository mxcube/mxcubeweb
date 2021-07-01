const initialState = {
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_UI_PROPERTIES':
    {
      return { ...state, ...action.data };
    }
    case 'SET_INITIAL_STATE':
    {
      return { ...state, ...action.data.uiproperties };
    }
    default:
      return state;
  }
};
