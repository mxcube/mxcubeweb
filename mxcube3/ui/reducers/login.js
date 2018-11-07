const initialState = {
  loginInfo: {},
  loggedIn: false,
  data: {},
  showProposalsForm: false,
  selectedProposal: '',
  selectedProposalID: ''
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
            selectedProposal: state.selectedProposal ?
              state.selectedProposal : action.loginInfo.selectedProposal,
            selectedProposalID: state.selectedProposalID ?
              state.selectedProposalID : action.loginInfo.selectedProposalID,
            loggedIn,
            data
          });
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
        const proposals = state.data.proposalList;

        const propInfo = proposals.find(prop => {
          const name = `${prop.Proposal.code}${prop.Proposal.number}`;
          return name === action.proposal;
        });
        const propId = propInfo.Proposal.proposalId;

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
