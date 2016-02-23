import fetch from 'isomorphic-fetch'

export function setLight(on) {
  return { 
    type: "SET_LIGHT",
    on: on
  }
}


export function setZoom(level) {
  return { 
    type: "SET_ZOOM",
    level: level
  }
}

export function StartClickCentring() {
  return { 
    type: "START_CLICK_CENTRING"
  }
}

export function StopClickCentring() {
  return { 
    type: "STOP_CLICK_CENTRING"
  }
}

export function SavePoint(point) {
  return { 
    type: "SAVE_POINT",
    point: point
  }
}

export function DeletePoint(id) {
  return { 
    type: "DELETE_POINT",
    id: id
  }
}

export function SaveImageSize(x,y,) {
  return { 
    type: "SAVE_IMAGE_SIZE",
    width: x,
    height: y
  }
}

export function updatePointsPosition(points) {
  return { 
    type: "UPDATE_POINTS_POSITION",
    points: points
  }
}

export function sendStartClickCentring() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/centring/start3click', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to start 3click");
    }else{
      dispatch(StartClickCentring());
    }
  });
}
}

export function sendCentringPoint(x, y) {
  return function() {
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
  return function() {
   fetch('/mxcube/api/v0.1/sampleview/centring/startauto', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to start autocentring");
    }
  });
}
}

export function sendSavePoint(id) {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/centring/' + id, { 
    method: 'POST', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to save point");
    }
    return response.json();
  }).then(function(json) {
      dispatch(SavePoint(json));
    });

}
}

export function sendDeletePoint(id) {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/centring/' + id, { 
    method: 'DELETE', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to delete point");
    }
    return response.json();
  }).then(function() {
      dispatch(DeletePoint(id));
    });

}
}

export function sendZoomPos(level) {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/zoom', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
  body: JSON.stringify({level: level})
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to zoom");
    }
  }).then(function() {
      dispatch(setZoom(level));
    });

}
}

export function sendLightOn() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/lighton', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to turn light on");
    }
  }).then(function() {
      dispatch(setLight(true));
    });
}
}

export function sendLightOff() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/lightoff', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to turn light off");
    }
  }).then(function() {
      dispatch(setLight(false));
    });

}
}

export function sendAbortCentring() {
  return function() {
   fetch('/mxcube/api/v0.1/sampleview/centring/abort', { 
    method: 'PUT', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to turn light off");
    }
  });

}
}

export function getSampleImageSize() {
  return function(dispatch) {
   fetch('/mxcube/api/v0.1/sampleview/camera', { 
    method: 'GET', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to return image size");
    }
 return response.json();
  }).then(function(json) {
      dispatch(SaveImageSize(json.imageWidth, json.imageHeight));
    });

}
}


export function getPointsPosition() {
  return function(dispatch) {
   fetch('mxcube/api/v0.1/sampleview/centring', { 
    method: 'GET', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(function(response) {
    if (response.status >= 400) {
      throw new Error("Server refused to return points position");
    }
 return response.json();
  }).then(function(json) {
      dispatch(updatePointsPosition(json));
    });

}
}