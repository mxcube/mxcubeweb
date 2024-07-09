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
    const response = await sendRefresh();

    if (response.status >= 400) {
      throw new Error('Error refreshing harvester contents');
    }

    const contents = await response.json();
    dispatch(setContents(contents));
  };
}

export function harvestCrystal(xtalUUID, successCb = null) {
  return async (dispatch) => {
    const response = await sendHarvestCrystal(xtalUUID);

    if (response.status >= 400) {
      dispatch(showErrorPanel(true, response.headers.get('message')));
      throw new Error('Server refused to Harveste Crystal');
    }

    const contents = await response.json();
    dispatch(setContents(contents));

    if (successCb) {
      successCb();
    }
  };
}

export function harvestAndLoadCrystal(xtalUUID, successCb = null) {
  return async (dispatch) => {
    const response = await sendHarvestAndLoadCrystal(xtalUUID);

    if (response.status >= 400) {
      dispatch(showErrorPanel(true, response.headers.get('message')));
      throw new Error('Server refused to Harveste or Load Crystal');
    }

    const contents = await response.json();
    dispatch(setContents(contents));

    if (successCb) {
      successCb();
    }
  };
}

export function sendDataCollectionToCrims() {
  return async (dispatch) => {
    const response = await sendDCToCrims();

    if (response.status >= 400) {
      dispatch(showErrorPanel(true, response.headers.get('message')));
      throw new Error('Server refused to Harveste or Load Crystal');
    }

    // temporary use ErrorPanel to display success message
    dispatch(showErrorPanel(true, 'Succesfully Send DC to Crims'));

    const contents = await response.json();
    dispatch(setContents(contents));
  };
}

export function calibratePin(successCb = null) {
  return async (dispatch) => {
    const response = await sendCalibratePin();

    if (response.status >= 400) {
      dispatch(showErrorPanel(true, response.headers.get('message')));
      throw new Error('Calibration Procedure Failed');
    }

    const contents = await response.json();
    dispatch(setContents(contents));

    if (successCb) {
      successCb();
    }
  };
}

export function validateCalibration(validated, successCb = null) {
  return async (dispatch) => {
    const response = await sendValidateCalibration(validated);

    if (response.status >= 400) {
      dispatch(showErrorPanel(true, response.headers.get('message')));
      throw new Error('Calibration Procedure Failed');
    }

    const contents = await response.json();
    dispatch(setContents(contents));

    if (successCb) {
      successCb();
    }
  };
}

export function abort() {
  return async (dispatch) => {
    const response = await sendAbort();

    if (response.status < 400) {
      dispatch(showErrorPanel(true, 'action aborted'));
    }
  };
}

export function sendCommand(cmdparts, args) {
  return async (dispatch) => {
    const response = await sendCmd(cmdparts, args);

    if (response.status >= 400) {
      dispatch(showErrorPanel(true, response.headers.get('message')));
      throw new Error(`Error while  sending command @ ${cmdparts}`);
    }

    const answer = await response.json();
    dispatch(setHarvesterCommandResponse(answer.response));
    dispatch(setContents(answer.contents));
  };
}
