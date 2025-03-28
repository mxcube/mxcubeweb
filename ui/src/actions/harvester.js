import {
  sendAbortHarvester,
  sendCalibratePin,
  sendDataCollectionInfoToCrims,
  sendHarvestAndLoadCrystal,
  sendHarvestCrystal,
  sendHarvesterCommand,
  sendRefresh,
  sendValidateCalibration,
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
      throw new Error('Server refused to harvest crystal');
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
      throw new Error('Server refused to harvest or load crystal');
    }
  };
}

export function sendDataCollectionToCrims() {
  return async (dispatch) => {
    try {
      const contents = await sendDataCollectionInfoToCrims();
      dispatch(setContents(contents));

      // temporary use ErrorPanel to display success message
      dispatch(showErrorPanel(true, 'Succesfully sent DC to Crims'));
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error('Server refused to send DC to Crims');
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
      throw new Error('Calibration procedure failed');
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
      throw new Error('Calibration procedure failed');
    }
  };
}

export function abort() {
  return async (dispatch) => {
    await sendAbortHarvester();
    dispatch(showErrorPanel(true, 'action aborted'));
  };
}

export function sendCommand(cmdparts, args) {
  return async (dispatch) => {
    try {
      const answer = await sendHarvesterCommand(cmdparts, args);
      dispatch(setHarvesterCommandResponse(answer.response));
      dispatch(setContents(answer.contents));
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw new Error(`Error while sending command @ ${cmdparts}`);
    }
  };
}
