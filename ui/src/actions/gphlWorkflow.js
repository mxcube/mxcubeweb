import { sendSubmitGphlWorkflowParameters } from '../api/gphlWorkflow';

export function showGphlWorkflowParametersDialog(formData, show = true) {
  return { type: 'SHOW_GPHL_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}

export function submitGphlWorkflowParameters(data) {
  return () => {
    sendSubmitGphlWorkflowParameters(data);
  };
}
