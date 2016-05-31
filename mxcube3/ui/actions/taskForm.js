import { sendCurrentPhase } from './sampleview';

export function showTaskForm(formName, sample_queueID = -1, taskData = {}, point_queueID = -1) {
  return function (dispatch) {
    if (formName === 'AddSample') {
      dispatch(sendCurrentPhase('Transfer'));
    }
    dispatch(showForm(formName, sample_queueID, taskData, point_queueID));
  };
}



export function showForm(formName, sample_queueID, taskData, point_queueID) {
  return {
    type: 'SHOW_FORM',
    name: formName,
    sample_ids: sample_queueID,
    taskData: taskData,
    point_id: point_queueID
  };
}

export function hideTaskParametersForm() {
  return {
    type: 'HIDE_FORM'
  };
}

