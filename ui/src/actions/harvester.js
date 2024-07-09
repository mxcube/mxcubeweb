import {
  sendRefresh,
  sendHarvestCrystal,
  sendHarvestAndLoadCrystal,
  sendCalibratePin,
  sendValidateCalibration,
  sendAbort,
  sendDataCollectionToCrims as sendDCToCrims,
  sendCommand as sendCmd,
} from '../api/harvester';

import { showErrorPanel } from './general';

export function setContents(contents) {
  return {
    type: 'SET_HARVESTER_CONTENTS',
    data: { harvesterContents: contents },
  };
}

export function setHarvesterState(state) {
  return { type: 'SET_HARVESTER_STATE', state };
}

export function updateHarvesterContents(data) {
  return { type: 'UPDATE_HARVESTER_CONTENTS', data };
}

export function setHarvesterCommandResponse(response) {
  return { type: 'SET_HARVESTER_RESPONSE', response };
}

export function refresh() {
  return async (dispatch) => {
    try {
      const contents = await sendRefresh();
      dispatch(setContents(contents));
    } catch {
      throw new TypeError('Error refreshing harvester contents');
    }
  };
}

export function harvestCrystal(xtalUUID, successCb = null) {
  return async (dispatch) => {
    try {
      const contents = await sendHarvestCrystal(xtalUUID);
      dispatch(setContents(contents));

      if (successCb) {
        successCb();
      }
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error('Server refused to Harveste Crystal');
    }
  };
}

export function harvestAndLoadCrystal(xtalUUID, successCb = null) {
  return async (dispatch) => {
    try {
      const contents = await sendHarvestAndLoadCrystal(xtalUUID);
      dispatch(setContents(contents));

      if (successCb) {
        successCb();
      }
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error('Server refused to Harveste or Load Crystal');
    }
  };
}

export function sendDataCollectionToCrims() {
  return async (dispatch) => {
    try {
      const contents = await sendDCToCrims();
      dispatch(setContents(contents));

      // temporary use ErrorPanel to display success message
      dispatch(showErrorPanel(true, 'Succesfully Send DC to Crims'));
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error('Server refused to Harveste or Load Crystal');
    }
  };
}

export function calibratePin(successCb = null) {
  return async (dispatch) => {
    try {
      const contents = await sendCalibratePin();
      dispatch(setContents(contents));

      if (successCb) {
        successCb();
      }
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error('Calibration Procedure Failed');
    }
  };
}

export function validateCalibration(validated, successCb = null) {
  return async (dispatch) => {
    try {
      const contents = await sendValidateCalibration(validated);
      dispatch(setContents(contents));

      if (successCb) {
        successCb();
      }
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error('Calibration Procedure Failed');
    }
  };
}

export function abort() {
  return async (dispatch) => {
    await sendAbort();
    dispatch(showErrorPanel(true, 'action aborted'));
  };
}

export function sendCommand(cmdparts, args) {
  return async (dispatch) => {
    try {
      const answer = await sendCmd(cmdparts, args);
      dispatch(setHarvesterCommandResponse(answer.response));
      dispatch(setContents(answer.contents));
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error(`Error while  sending command @ ${cmdparts}`);
    }
  };
}
