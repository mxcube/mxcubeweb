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


export function setBeamlinePropertyRequest(name, value, deferred){
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
              if( data.status === "VALID" ){
                  dispatch(setPropertyValueDispatch(data));
                  deferred.resolve(data);
              } 
              else if( data.status === "ABORTED" ){
                  dispatch(setPropertyValueDispatch(data));
                  deferred.reject(data);
              }
              else{
                  deferred.reject(data);
              }

          }, () => {
              deferred.reject({msg: "Server connection problem"});
              throw new Error("Server connection problem");
          });
    };
}


export function cancelValueChangeRequest(name){
    return function(dispatch) {
        fetch('mxcube/api/v0.1/beamline/' + name + '/abort', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            credentials: 'include'
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