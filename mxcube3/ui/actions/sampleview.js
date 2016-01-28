import fetch from 'isomorphic-fetch'

export function sendStartClickCentring() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/centring/start3click', { 
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

export function sendCentringPoint(x, y) {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/centring/click', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify({clickPos:{ x : x, y: y }})
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to add point");
    }
  });
}
}

export function sendStartAutoCentring() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/centring/startauto', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to start autocentring");
    }
  });
}
}

export function sendTakeSnapShot() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/samplecentring/snapshot', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to take snapshot");
    }
  });
}
}

export function sendSavePoint() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/centring/0', { 
    method: 'POST', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to save point");
    }
    return response.json();
  }).then(function(json) {
      console.log(json);
    });

}
}