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
        motors.then(response => { return response.json() }).then(json => { state.Motors = json }),
        beamInfo.then(response => { return response.json() }).then(json => { state.beamInfo = json }),
        sampleVideoInfo.then(response => { return response.json() }).then(json => { state.Camera = json }),
        diffractometerInfo.then(response => { return response.json() }).then(json => { Object.assign(state, json) }),
        dataPath.then(response => { return response.json() }).then(path => { Object.assign(state, {rootPath: path} ) }),
        dcParameters.then(response => { return response.json() }).then(json => { state.dcParameters = json })
    ]
    
    Promise.all(pchains).then(() => {
      dispatch(setInitialStatus(state));
    });
  };
}
