const INITIAL_STATE = {
  loggedIn: null, // null means loggedIn state is not known yet
  showProposalsForm: false,
  selectedProposal: '',
  selectedProposalID: '',
  rootPath: '',
  user: {
    inControl: false,
  },
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
      };
    }
    case 'SHOW_PROPOSALS_FORM': {
      return {
        ...state,
        showProposalsForm: true,
      };
    }
    case 'SELECT_PROPOSAL': {
      const proposals = state.proposalList;

      const propInfo = proposals.find((prop) => {
        // const name = `${prop.code}${prop.number}`;
        return prop.session_id === action.proposal;
      });

      return {
        ...state,
        selectedProposal: action.proposal,
        selectedProposalID: propInfo.session_id,
        showProposalsForm: false,
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
