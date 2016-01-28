import fetch from 'isomorphic-fetch'

export function SendStartClickCentring() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/samplecentring/centring/start3click', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to start 3click");
    }
  });
}
}

export function SendCentringPoint(proposal, password) {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/samplecentring/centring/click', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to add point");
    }
  });
}
}