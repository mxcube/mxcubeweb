const INITIAL_STATE = {
  loggedIn: null, // null means loggedIn state is not known yet
  showProposalsForm: false,
  selectedProposal: '',
  selectedProposalID: '',
  rootPath: '',
  user: {
    inControl: false,
  },
  sessionRefreshInterval: 9000,
};

function loginReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_LOGIN_INFO': {
      const {
        beamlineName,
        synchrotronName,
        loginType,
        user,
        proposalList,
        selectedProposal,
        selectedProposalID,
        loggedIn,
        rootPath,
        limsName,
        useSSO,
        sessionRefreshInterval,
      } = action.loginInfo;
      return {
        ...state,
        beamlineName,
        synchrotronName,
        loginType,
        user,
        proposalList,
        selectedProposal,
        selectedProposalID,
        loggedIn,
        rootPath,
        limsName,
        useSSO,
        sessionRefreshInterval,
      };
    }
    case 'SHOW_PROPOSALS_FORM': {
      return {
        ...state,
        showProposalsForm: true,
      };
    }
    case 'HIDE_PROPOSALS_FORM': {
      return { ...state, showProposalsForm: false };
    }
    default: {
      return state;
    }
  }
}

export default loginReducer;
