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
    let sampleVideoInfo = fetch('mxcube/api/v0.1/sampleview/camera/info', {
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

    motors.then(response => { state.Motors = response.json() });
    beamInfo.then(response => { state.beamInfo = response.json() });
    sampleVideoInfo.then(response => { state.Camera = response.json() });
    diffractometerInfo.then(response => { Object.assign(state, response.json()) });
    
    Promise.all([motors,beamInfo,sampleVideoInfo,diffractometerInfo]).then(() => {
      dispatch(setInitialStatus(state));
    });
  };
}
