import fetch from 'isomorphic-fetch'
import { getSampleImageSize } from './sampleview'

export function doLogin(proposal, password) {
    return function(dispatch) {
         fetch('mxcube/api/v0.1/login', { 
            method: 'POST', 
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify({ proposal, password })
          }).then(response => response.json())
          .then(json => {
                // Here one should check if login is successfull and if so get initial state of MxCube
                dispatch(getSampleImageSize());
                dispatch(afterLogin(json));
          }, () => {
            throw new Error("Server connection problem (login)"); 
          })
    }
}

export function getLoginInfo() {
  return function(dispatch) {
   fetch('mxcube/api/v0.1/login_info', { 
    method: 'GET', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    }
  }).then(response => response.json())
          .then(json => {
              dispatch(setLoginInfo(json));
          }, () => {
            throw new Error("Server connection problem (getLoginInfo)"); 
          })
    }
}

export function setLoginInfo(loginInfo) {
    return { 
      type: "SET_LOGIN_INFO",
      loginInfo: loginInfo
    }
}

export function afterLogin(data) {
    if (data.status.code=="error")
      return {type: "LOGIN", data:{ }, status: data.status }
    else
      return {type: "LOGIN", data: data, status: data.status }
}

export function doSignOut() {
    return { type: "SIGNOUT" }
}
