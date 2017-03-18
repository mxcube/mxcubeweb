const initialState = {
  loginInfo: {},
  loggedIn: false,
  data: {},
  showForm: '',
  selectedProposal: ''
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
    case 'SHOW_PROPOSALS_FORM':
      {
        return {
          ...state,
          showForm: action.name,
        };
      }
    case 'SELECT_PROPOSAL':
      {
        return {
          ...state,
          selectedProposal: action.proposal,
        };
      }
    case 'HIDE_FORM':
      {
        return { ...state, showForm: '' };
      }
    default:
      return state;
  }
};
