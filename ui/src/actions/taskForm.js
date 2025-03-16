export function showForm(
  formName,
  sampleQueueID = [],
  taskData = {},
  pointQueueID = -1
) {
  return {
    type: 'SHOW_FORM',
    name: formName,
    sampleIDs: sampleQueueID,
    taskData,
    pointID: pointQueueID,
  };
}

// 3-click右键调用的是这个
export function showTaskForm(
  formName,
  sampleQueueID = -1,
  taskData = {},
  pointQueueID = -1
) {
  return function (dispatch) {
    dispatch(showForm(formName, sampleQueueID, taskData, pointQueueID));
  };
}

export function updateSampleID(
  sampleQueueID = [],
){
  return {
    type : 'UPDATE_SAMPLEIDS',
    sampleIDs : sampleQueueID,
  };
}


export function updateTaskData(
  sampleQueueID = [],
  taskData = {},
){
  return {
    type : 'UPDATE_TASK_DATA',
    sampleIDs: sampleQueueID,
    taskData,
  }
}

export function hideTaskParametersForm() {
  return {
    type: 'HIDE_FORM',
  };
}

export function resetTaskParameters() {
  return {
    type: 'RESET_TASK_PARAMETERS',
  };
}

export function updateDefaultParameters(taskData) {
  return {
    type: 'UPDATE_DEFAULT_PARAMETERS',
    data: taskData,
  };
}
