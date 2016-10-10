export function showForm(formName, sampleQueueID = [], taskData = {}, pointQueueID = -1) {
  return {
    type: 'SHOW_FORM',
    name: formName,
    sampleIDs: sampleQueueID,
    taskData,
    point_id: pointQueueID
  };
}

export function showTaskForm(formName, sampleQueueID = -1, taskData = {}, pointQueueID = -1) {
  return function (dispatch) {
    dispatch(showForm(formName, sampleQueueID, taskData, pointQueueID));
  };
}

export function hideTaskParametersForm() {
  return {
    type: 'HIDE_FORM'
  };
}

