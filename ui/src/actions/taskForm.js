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
 * @typedef {Object} DoseRateParameters
 * @property {number} energy_kev
 * @property {number} transmission_pct
 *
 * @param {DoseRateParameters} doseRateParams
 */
export function estimateDoseRate(doseRateParams) {
  return async (dispatch) => {
    let result;
    try {
      const response = await sendExecuteCommand(
        'doseestimator',
        'dose_estimator',
        'estimate_dose_rate',
        doseRateParams,
      );
      result = { mgy_per_s: response.return };
    } catch (error) {
      // 422: no estimate possible for these inputs, e.g. unknown flux.
      // Anything else (e.g. an empty energy field) shows N/A rather than
      // a stale rate.
      result = error.status === 422 ? { msg: error.json?.msg } : null;
    }
    dispatch({ type: 'SET_DOSE_RATE', data: result });
  };
}
