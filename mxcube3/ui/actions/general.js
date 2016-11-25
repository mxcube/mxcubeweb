import fetch from 'isomorphic-fetch';

export function addUserMessage(record, target) {
  let duration = undefined;
  let level = 'INFO';
  const message = record.message;
  const details = record.stack_trace;
  const meta = record.logger;

  if (record.severity === 'ERROR') {
    duration = 5000;
    level = 'ERROR';
  } else if (record.severutiy === 'WARNING') {
    duration = 5000;
    level = 'WARNING';
  } else {
    duration = 5000;
  }

  let exp = new Date().getTime();
  exp += duration;

  return { type: 'ADD_USER_MESSAGE',
           message: { message, details, level, duration, exp, meta, target } };
}


export function removeUserMessage(messageID) {
  return { type: 'REMOVE_USER_MESSAGE', messageID };
}


export function clearAllUserMessages() {
  return { type: 'CLEAR_ALL_USER_MESSAGES' };
}


export function setInitialStatus(data) {
  return { type: 'SET_INITIAL_STATUS', data };
}

export function setLoading(loading, title = '', message = '', blocking = false,
                           abortFun = undefined) {
  return {
    type: 'SET_LOADING', loading, title, message, blocking, abortFun
  };
}

export function showErrorPanel(show, message = '') {
  return {
    type: 'SHOW_ERROR_PANEL', show, message
  };
}


export function showDialog(show, title = '', message = '') {
  return {
    type: 'SHOW_DIALOG', show, title, message
  };
}

function parse(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function notify(error) {
  console.error('REQUEST FAILED', error);
}

export function getInitialStatus() {
  return function (dispatch) {
    const state = {};

    const motors = fetch('mxcube/api/v0.1/diffractometer/movables/state', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
    const beamInfo = fetch('mxcube/api/v0.1/beam/info', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
    const sampleVideoInfo = fetch('mxcube/api/v0.1/sampleview/camera', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
    const diffractometerInfo = fetch('mxcube/api/v0.1/diffractometer/info', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
    const dataPath = fetch('mxcube/api/v0.1/beamline/datapath', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
    const dcParameters = fetch('mxcube/api/v0.1/queue/dc', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
    const savedPoints = fetch('mxcube/api/v0.1/sampleview/centring', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
    const sampleChangerContents = fetch('mxcube/api/v0.1/sample_changer/contents', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });

    const pchains = [
      motors.then(parse).then(json => { state.Motors = json; }).catch(notify),
      beamInfo.then(parse).then(json => { state.beamInfo = json; }).catch(notify),
      sampleVideoInfo.then(parse).then(json => { state.Camera = json; }).catch(notify),
      diffractometerInfo.then(parse).then(json => { Object.assign(state, json); }).catch(notify),
      dataPath.then(parse).then(path => { state.rootPath = path; }).catch(notify),
      dcParameters.then(parse).then(json => { state.dcParameters = json; }).catch(notify),
      savedPoints.then(parse).then(json => { state.points = json; }).catch(notify),
      sampleChangerContents.then(parse).then(json => {
        state.sampleChangerContents = json;
      }).catch(notify)
    ];

    Promise.all(pchains).then(() => {
      dispatch(setInitialStatus(state));
    });
  };
}
