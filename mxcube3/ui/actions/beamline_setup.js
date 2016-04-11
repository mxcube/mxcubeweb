import fetch from 'isomorphic-fetch';

export function getBeamlineProperties() {
    return function(dispatch) {
        fetch('mxcube/api/v0.1/beamline/info', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            credentials: 'include'
        }).then(response => response.json())
          .then(data => {
              dispatch(getBeamlinePropertiesDispatch(data));
          }, () => {
              throw new Error("Server connection problem (login)");
          });
    };
}


export function setBeamlineProperty(name, value){
    return function(dispatch) {
        console.log('mxcube/api/v0.1/beamline/' + name + '/set?value=' + value);
        fetch('mxcube/api/v0.1/beamline/' + name + '/set?value=' + value, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            credentials: 'include'
        }).then(response => response.json())
          .then(data => {
              dispatch(setPropertyValueDispatch(data));
          }, () => {
              throw new Error("Server connection problem (login)");
          });
    };
}


export function setPropertyValueDispatch(data) {
    return {
        type: "SET_BEAMLINE_PROPERTY",
        data: data
    };
}


export function getBeamlinePropertiesDispatch(data) {
    return {
        type: "GET_BEAMLINE_PROPERTIES",
        data: data
    };
}