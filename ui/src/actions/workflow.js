import { sendSubmitWorkflowParameters } from '../api/workflow';

export function showWorkflowParametersDialog(formData, show = true) {
  return { type: 'SHOW_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}

export function showGphlWorkflowParametersDialog(formData, show = true) {
  return { type: 'SHOW_GPHL_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}

export function submitWorkflowParameters(data) {
  return () => {
    sendSubmitWorkflowParameters(data);
  };
}
