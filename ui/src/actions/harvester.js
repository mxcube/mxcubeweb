import fetch from 'isomorphic-fetch';
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
  return function (dispatch) {
    fetch('mxcube/api/v0.1/harvester/contents', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      credentials: 'include',
    }).then((response) => {
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
  return function (dispatch) {
    fetch('mxcube/api/v0.1/harvester/harvest', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(xtalUUID),
    }).then((response) => {
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
  return function (dispatch) {
    fetch('mxcube/api/v0.1/harvester/harvest_and_mount', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(xtalUUID),
    }).then((response) => {
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

export function calibratePin(successCb = null) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/harvester/calibrate', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    }).then((response) => {
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
  return function (dispatch) {
    fetch('mxcube/api/v0.1/harvester/validate_calibration', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(validated),
    }).then((response) => {
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
  return function (dispatch) {
    fetch('mxcube/api/v0.1/harvester/send_command/abort', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      credentials: 'include',
    }).then((response) => {
      if (response.status < 400) {
        dispatch(showErrorPanel(true, 'action aborted'));
      }
    });
  };
}

export function sendCommand(cmdparts, args) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/harvester/send_command/${cmdparts}/${args}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      credentials: 'include',
    }).then((response) => {
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
