import fetch from 'isomorphic-fetch';

export function setContents(contents) {
  return { type: 'SET_SC_CONTENTS', data: { sampleChangerContents: contents } };
}

export function setState(state) {
  return { type: 'SET_SC_STATE', state };
}

export function refresh() {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/sample_changer/contents', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => {
      if (response.status >= 400) {
        dispatch(setState('ERROR'));
        throw new Error('Error refreshing sample changer contents');
      }

      response.json().then(contents => { dispatch(setContents(contents)); });
    });
  };
}

export function select(address) {
  return function (dispatch) {
    dispatch(setState('MOVING'));

    fetch(`mxcube/api/v0.1/sample_changer/select/${address}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => {
      if (response.status >= 400) {
        dispatch(setState('ERROR'));
        throw new Error(`Error while selecting sample changer container @ ${address}`);
      }

      response.json().then(contents => { dispatch(setContents(contents)); });

      dispatch(setState('READY'));
    });
  };
}

export function scan(address) {
  return function (dispatch) {
    dispatch(setState('MOVING'));

    fetch(`mxcube/api/v0.1/sample_changer/scan/${address}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => {
      if (response.status >= 400) {
        dispatch(setState('ERROR'));
        throw new Error(`Error while scanning sample changer @ ${address}`);
      }

      response.json().then(contents => { dispatch(setContents(contents)); });

      dispatch(setState('READY'));
    });
  };
}

export function loadSample(address) {
  return function (dispatch) {
    dispatch(setState('MOVING'));

    fetch(`mxcube/api/v0.1/sample_changer/mount/${address}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => {
      if (response.status >= 400) {
        dispatch(setState('ERROR'));
        throw new Error(`Error while  sample loading sample @ ${address}`);
      }

      response.json().then(contents => { dispatch(setContents(contents)); });

      dispatch(setState('READY'));
    });
  };
}

export function unloadSample(address) {
  return function (dispatch) {
    dispatch(setState('MOVING'));

    fetch(`mxcube/api/v0.1/sample_changer/unmount/${address}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => {
      if (response.status >= 400) {
        dispatch(setState('ERROR'));
        throw new Error(`Error while  sample unloading sample @ ${address}`);
      }

      response.json().then(contents => { dispatch(setContents(contents)); });

      dispatch(setState('READY'));
    });
  };
}
