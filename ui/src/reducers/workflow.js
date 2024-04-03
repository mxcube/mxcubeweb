import {
  saveToLastUsedParameters,
  getLastUsedParameters,
} from '../components/Tasks/fields';

const INITIAL_STATE = {
  workflows: [],
  current: null,
  formData: {},
  showDialog: false,
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
      if (action.formData !== null) {
        saveToLastUsedParameters('workflow', action.formData);
      }

      const formData = action.formData || getLastUsedParameters('workflow');

      return {
        ...state,
        formData,
        showDialog: action.show,
      };
    }
    case 'SHOW_GPHL_WORKFLOW_PARAMETERS_DIALOG': {
      return {
        ...state,
        gphlParameters: action.formData,
        showGphlDialog: action.show,
      };
    }
    case 'UPDATE_GPHL_WORKFLOW_PARAMETERS_DIALOG': {
      return {
        ...state,
        gphlUpdatedParameters: action.data,
        fetchUpdated: action.update,
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
