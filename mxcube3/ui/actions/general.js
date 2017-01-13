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


export function setInitialState(data) {
  return { type: 'SET_INITIAL_STATE', data };
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
  // eslint-disable-next-line no-console
  console.error('REQUEST FAILED', error);
}

export function getInitialStatus() {
  return function (dispatch) {
    const state = {};

    const queue = fetch('mxcube/api/v0.1/queue_state', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });
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
    const beamlineSetup = fetch('mxcube/api/v0.1/beamline', {
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
    const observers = fetch('mxcube/api/v0.1/login/observers', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      }
    });

    const pchains = [
      queue.then(parse).then(json => { state.queue = json; }).catch(notify),
      motors.then(parse).then(json => { state.Motors = json; }).catch(notify),
      beamInfo.then(parse).then(json => { state.beamInfo = json; }).catch(notify),
      beamlineSetup.then(parse).then(json => { state.beamlineSetup = json; return json;}).then(
        json => { state.datapath = json.path; }).catch(notify),
      sampleVideoInfo.then(parse).then(json => { state.Camera = json; }).catch(notify),
      diffractometerInfo.then(parse).then(json => { Object.assign(state, json); }).catch(notify),
      dcParameters.then(parse).then(
        json => { state.dcParameters = json.acq_parameters; return json; }).then(
        json => { state.acqParametersLimits = json.limits; }).catch(notify),
      savedPoints.then(parse).then(json => { state.points = json; }).catch(notify),
      sampleChangerContents.then(parse).then(json => {
        state.sampleChangerContents = json;
      }).catch(notify),
      observers.then(parse).then(json => { state.remoteAccess = json.data; }).catch(notify)
    ];

    Promise.all(pchains).then(() => {
      dispatch(setInitialState(state));
    });
  };
}

export function showConnectionLostDialog(show = true) {
  return {
    type: 'SHOW_CONNECTION_LOST_DIALOG', show
  };
}
