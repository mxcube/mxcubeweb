const initialState = {
  show: false,
  shape: { type: 'NONE' },
  x: 0,
  y: 0
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SHOW_CONTEXT_MENU':
      {
        return {
          show: action.show,
          shape: action.shape,
          x: action.x,
          y: action.y
        };
      }
    default:
      return state;
  }
};
