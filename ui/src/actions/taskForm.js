import { sendExecuteCommand } from '../api/hardware-object';

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

/**
 * @typedef {Object} DoseEstimationParameters
 * @property {number} num_images
 * @property {number} exp_time_s
 * @property {number} energy_kev
 * @property {number} transmission_pct
 * @property {string} experimental_goal
 * @property {number} resolution_a
 *
 * @param {DoseEstimationParameters} doseParams
 */
export function estimateDose(doseParams) {
  return async (dispatch) => {
    const result = await sendExecuteCommand(
      'doseestimator',
      'dose_estimator',
      'estimate_dose',
      doseParams,
    );
    dispatch({ type: 'SET_DOSE_ESTIMATE', data: result });
  };
}
