const initialState = {
  master: false,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_MASTER':
      {
        return Object.assign({}, state,
          {
            master: action.master,
            sid: action.sid
          });
      }

    default:
      return state;
  }
};
