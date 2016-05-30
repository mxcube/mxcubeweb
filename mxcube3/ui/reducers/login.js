const initialState = {
  data: {},
  status: {},
  loginInfo: {},
  loggedIn: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'LOGIN':
      {
        if (action.status.code === 'error') {
          return Object.assign({}, state, action, { loggedIn: false });
        }
        return Object.assign({}, state, action, { loggedIn: true });
      }
    case 'SIGNOUT':
      {
        return Object.assign({}, state, initialState);
      }

    case 'SET_LOGIN_INFO':
      {
        return Object.assign({}, state,
          {
            loginInfo: action.loginInfo
          });
      }

    default:
      return state;
  }
};
