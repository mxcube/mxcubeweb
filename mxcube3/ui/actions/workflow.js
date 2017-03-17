export function showWorkflowParametersDialog(formData, show = true) {
  return { type: 'SHOW_WORKFLOW_PARAMETERS_DIALOG', formData, show };
}
