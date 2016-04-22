import fetch from 'isomorphic-fetch';

import {SET_ATTRIBUTE, SET_ALL_ATTRIBUTES, 
        SET_BUSY_STATE, STATE} from "./beamline_atypes";


export function getAllAttributes() {
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
              dispatch(beamlinePropertiesAction(data));
          }, () => {
              throw new Error("Server connection problem (login)");
          });
    };
}


export function setAttribute(name, value){
    return function(dispatch) {
        dispatch(busyStateAction(name));
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
              dispatch(beamlinePropertyValueAction(data));
          }, () => {
              throw new Error("Server connection problem");
          });
    };
}


export function abortCurrentAction(name){
    return function() {
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


export function beamlinePropertyValueAction(data) {
    return {
        type: SET_ATTRIBUTE,
        data: data
    };
}


export function beamlinePropertiesAction(data) {
    return {
        type: SET_ALL_ATTRIBUTES,
        data: data
    };
}


export function busyStateAction(name) {
    return {
        type: SET_BUSY_STATE,
        data: {name: name, state: STATE.BUSY}
    };
}