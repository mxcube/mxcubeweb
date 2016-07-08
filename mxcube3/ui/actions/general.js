import fetch from 'isomorphic-fetch';

export function setInitialStatus(data) {
  return { type: 'SET_INITIAL_STATUS', data };
}

export function setLoading(loading) {
  return {
    type: 'SET_LOADING', loading
  };
}

export function showErrorPanel(show, message = '') {
  return {
    type: 'SHOW_ERROR_PANEL', show, message
  };
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

function parseJSON(response) {
  return response.json()
}

function catchError(error){
  console.log('request failed', error);
}

export function getInitialStatus() {
  return function (dispatch) {
    let state = {};

    let motors = fetch('mxcube/api/v0.1/diffractometer/movables/state', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      }
    });
    let beamInfo = fetch('mxcube/api/v0.1/beam/info', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      }
    });
    let sampleVideoInfo = fetch('mxcube/api/v0.1/sampleview/camera', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      }
    });
    let diffractometerInfo = fetch('mxcube/api/v0.1/diffractometer/info', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      }
    });
    let dataPath = fetch('mxcube/api/v0.1/beamline/datapath', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      }
    });
    let dcParameters = fetch('mxcube/api/v0.1/queue/dc', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      }
    });

    let pchains = [
        motors.then(checkStatus).then(parseJSON).then(json => { state.Motors = json }).catch(catchError),
        beamInfo.then(checkStatus).then(parseJSON).then(json => { state.beamInfo = json }).catch(catchError),
        sampleVideoInfo.then(checkStatus).then(parseJSON).then(json => { state.Camera = json }).catch(catchError),
        diffractometerInfo.then(checkStatus).then(parseJSON).then(json => { Object.assign(state, json) }).catch(catchError),
        dataPath.then(checkStatus).then(parseJSON).then(path => { Object.assign(state, {rootPath: path} ) }).catch(catchError),
        dcParameters.then(checkStatus).then(parseJSON).then(json => { state.dcParameters = json }).catch(catchError)
    ]
    
    Promise.all(pchains).then(() => {
      dispatch(setInitialStatus(state));
    });
  };
}
