import { sendCurrentPhase } from './sampleview';

export function showTaskForm(formName, sample_queue_id = -1, taskData = {}, point_queue_id = -1) {
  return function (dispatch) {
    if (formName === 'AddSample') {
      dispatch(sendCurrentPhase('Transfer'));
    }
    dispatch(showForm(formName, sample_queue_id, taskData, point_queue_id));
  };
}



export function showForm(formName, sample_queue_id, taskData, point_queue_id) {
  return {
    type: 'SHOW_FORM',
    name: formName,
    sample_ids: sample_queue_id,
    taskData: taskData,
    point_id: point_queue_id
  };
}

export function hideTaskParametersForm() {
  return {
    type: 'HIDE_FORM'
  };
}

