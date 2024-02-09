export function showTaskForm(
  formName,
  sampleQueueID = -1,
  taskData = {},
  pointQueueID = -1,
  origin = 'sampleview',
) {
  return (dispatch) => {
    dispatch({
      type: 'SHOW_FORM',
      name: formName,
      sampleIDs: sampleQueueID,
      taskData,
      pointID: pointQueueID,
      origin,
    });
  };
}

export function hideTaskParametersForm() {
  return {
    type: 'HIDE_FORM',
  };
}
