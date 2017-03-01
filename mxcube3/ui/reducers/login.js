const initialState = {
  loginInfo: {},
  loggedIn: false,
  data: {}
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOGIN_INFO':
      {
        const data = action.loginInfo.loginRes;
        let loggedIn = false;
        if (Object.keys(data).length > 0) {
          loggedIn = data.status.code === 'ok';
        }
        return Object.assign({}, state,
          {
            loginInfo: action.loginInfo,
            loggedIn,
            data
          });
      }

    default:
      return state;
  }
};
