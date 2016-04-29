import fetch from 'isomorphic-fetch'

export function setInitialStatus(data) {
    return { type: "SET_INITIAL_STATUS", data }
}

export function setLoading(loading) {
    return { 
      type: "SET_LOADING", loading
    }
}

export function showErrorPanel(show, message="") {
    return { 
      type: "SHOW_ERROR_PANEL", show , message
    }
}

export function showDialog(show, title="", message="") {
    return { 
      type: "SHOW_DIALOG", show , title, message
    }
}

export function getInitialStatus() {
  return function(dispatch) {
    fetch('mxcube/api/v0.1/initialstatus', { 
        method: 'GET', 
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        }
    }).then(function(response) {
        if (response.status >= 400) {
            throw new Error("Server refused to send initialstatus");
        }
      return response.json();
    })
    .then(function(json) {
        dispatch(setInitialStatus(json));
    });

  }
}
