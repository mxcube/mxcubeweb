const INITIAL_STATE = {
  workflows: [],
  current: null,
};

function workflowReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SET_WORKFLOWS': {
      return { ...state, workflows: { ...action.workflows } };
    }
    case 'SET_CURRENT_WORKFLOW': {
      return { ...state, current: action.current };
    }
    case 'SHOW_WORKFLOW_PARAMETERS_DIALOG': {
      return {
        ...state,
        formData: action.formData,
        showParametersDialog: action.show,
      };
    }
    case 'SET_INITIAL_STATE': {
      const wf = action.data.workflow ? action.data.workflow.workflows : {};
      return { ...state, workflows: wf };
    }
    default: {
      return state;
    }
  }
}

export default workflowReducer;
