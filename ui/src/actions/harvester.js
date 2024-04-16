/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/prefer-await-to-then */
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
  return (dispatch) => {
    sendRefresh().then((response) => {
      if (response.status >= 400) {
        throw new Error('Error refreshing Harvester contents');
      }
      response.json().then((contents) => {
        dispatch(setContents(contents));
      });
    });
  };
}

export function harvestCrystal(xtalUUID, successCb = null) {
  return (dispatch) => {
    sendHarvestCrystal(xtalUUID).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, response.headers.get('message')));
        throw new Error('Server refused to Harveste Crystal');
      } else if (successCb) {
        successCb();
      }
      response.json().then((contents) => {
        dispatch(setContents(contents));
      });
    });
  };
}

export function harvestAndLoadCrystal(xtalUUID, successCb = null) {
  return (dispatch) => {
    sendHarvestAndLoadCrystal(xtalUUID).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, response.headers.get('message')));
        throw new Error('Server refused to Harveste or Load Crystal');
      } else if (successCb) {
        successCb();
      }
      response.json().then((contents) => {
        dispatch(setContents(contents));
      });
    });
  };
}

export function sendDataCollectionToCrims() {
  return (dispatch) => {
    sendDCToCrims().then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, response.headers.get('message')));
        throw new Error('Server refused to Harveste or Load Crystal');
      } else {
        // temporary use ErrorPanel to display success message
        dispatch(showErrorPanel(true, 'Succesfully Send DC to Crims'));
      }
      response.json().then((contents) => {
        dispatch(setContents(contents));
      });
    });
  };
}

export function calibratePin(successCb = null) {
  return (dispatch) => {
    sendCalibratePin().then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, response.headers.get('message')));
        throw new Error('Calibration Procedure Failed');
      } else if (successCb) {
        successCb();
      }
      response.json().then((contents) => {
        dispatch(setContents(contents));
      });
    });
  };
}

export function validateCalibration(validated, successCb = null) {
  return (dispatch) => {
    sendValidateCalibration(validated).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, response.headers.get('message')));
        throw new Error('Calibration Procedure Failed');
      } else if (successCb) {
        successCb();
      }
      response.json().then((contents) => {
        dispatch(setContents(contents));
      });
    });
  };
}

export function abort() {
  return (dispatch) => {
    sendAbort().then((response) => {
      if (response.status < 400) {
        dispatch(showErrorPanel(true, 'action aborted'));
      }
    });
  };
}

export function sendCommand(cmdparts, args) {
  return (dispatch) => {
    sendCmd(cmdparts, args).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, response.headers.get('message')));
        throw new Error(`Error while  sending command @ ${cmdparts}`);
      }
      response.json().then((answer) => {
        dispatch(setHarvesterCommandResponse(answer.response));
        dispatch(setContents(answer.contents));
      });
    });
  };
}
