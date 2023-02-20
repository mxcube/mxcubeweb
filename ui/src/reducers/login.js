const initialState = {
  loggedIn: false,
  showProposalsForm: false,
  selectedProposal: '',
  selectedProposalID: '',
  rootPath: '',
  user: {
    inControl: false
  }
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOGIN_INFO':
      {
        if (action.loginInfo.user.username !== "") {
          localStorage.setItem('currentUser', action.loginInfo.user.username);
        }

        return {
          ...state,
          beamlineName: action.loginInfo.beamlineName,
          synchrotronName: action.loginInfo.synchrotronName,
          loginType: action.loginInfo.loginType,
          user: action.loginInfo.user,
          proposalList: action.loginInfo.proposalList,
          selectedProposal: action.loginInfo.selectedProposal,
          selectedProposalID: action.loginInfo.selectedProposalID,
          loggedIn: action.loginInfo.loggedIn,
          rootPath: action.loginInfo.rootPath,
        };
      }
    case 'SHOW_PROPOSALS_FORM':
      {
        return {
          ...state,
          showProposalsForm: true,
        };
      }
    case 'SELECT_PROPOSAL':
      {
        const proposals = state.proposalList;

        const propInfo = proposals.find((prop) => {
          const name = `${prop.code}${prop.number}`;
          return name === action.proposal;
        });
        const propId = propInfo.proposalId;

        return {
          ...state,
          selectedProposal: action.proposal,
          selectedProposalID: propId
        };
      }
    case 'HIDE_PROPOSALS_FORM':
      {
        return { ...state, showProposalsForm: false };
      }
    default:
      return state;
  }
};
