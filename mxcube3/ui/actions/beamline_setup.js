import fetch from 'isomorphic-fetch';

export function getBeamlinePropertiesRequest() {
    return function(dispatch) {
        fetch('mxcube/api/v0.1/beamline', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            credentials: 'include'
        }).then(response => response.json())
          .then(data => {
              dispatch(setPropertiesDispatch(data));
          }, () => {
              throw new Error("Server connection problem (login)");
          });
    };
}


export function setBeamlinePropertyRequest(name, value, promise){
    return function(dispatch) {
        fetch('mxcube/api/v0.1/beamline/' + name, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({name, value})
        }).then(response => response.json())
          .then(data => {
              dispatch(setPropertyValueDispatch(data));
              promise.resolve();
          }, () => {
              promise.reject("Server connection problem");
              throw new Error("Server connection problem");
          });
    };
}


export function setPropertyValueDispatch(data) {
    return {
        type: "SET_BEAMLINE_PROPERTY",
        data: data
    };
}


export function setPropertiesDispatch(data) {
    return {
        type: "SET_BEAMLINE_PROPERTIES",
        data: data
    };
}