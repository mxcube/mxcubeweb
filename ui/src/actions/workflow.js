import {
  sendSubmitWorkflowParameters,
  sendUpdatedGphlWorkflowParameters,
} from '../api/workflow';

export function showWorkflowParametersDialog(formData = null, show = true) {
  return { type: 'SHOW_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}

export function showGphlWorkflowParametersDialog(formData, show = true) {
  return { type: 'SHOW_GPHL_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}

export function updateGphlWorkflowParametersDialog(data, update = true) {
  return { type: 'UPDATE_GPHL_WORKFLOW_PARAMETERS_DIALOG', data, update };
}

export function submitWorkflowParameters(data) {
  return () => {
    sendSubmitWorkflowParameters(data);
  };
}

export function updateGphlWorkflowParameters(data) {
  return () => {
    sendUpdatedGphlWorkflowParameters(data);
  };
}
