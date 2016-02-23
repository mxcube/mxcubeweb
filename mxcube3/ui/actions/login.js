import fetch from 'isomorphic-fetch'
import { getSampleImageSize, getPointsPosition } from './sampleview'

export function doLogin(proposal, password) {
    return function(dispatch) {
         fetch('mxcube/api/v0.1/login', { 
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ proposal, password })
          }).then(response => response.json())
          .then(loginRes => {
              // Here one should check if login is successfull and if so get initial state of MxCube
              dispatch(getPointsPosition());
              dispatch(getSampleImageSize());
              dispatch(afterLogin(loginRes));
          }, () => { throw new Error("Server connection problem (login)"); });
    }
}

export function doSignOut() {
    return function(dispatch) {
        fetch('mxcube/api/v0.1/signout', { credentials: 'include' }).then(dispatch(signOut));
    }
}

export function getLoginInfo() {
  return function(dispatch) {
   fetch('mxcube/api/v0.1/login_info', { 
    method: 'GET', 
    headers: {
      'Accept': 'application/json',
      'Content-type': 'application/json'
    },
    credentials: 'include'
  }).then(response => response.json())
          .then(loginInfo => {
              dispatch(setLoginInfo(loginInfo));
              if (Object.keys(loginInfo.loginRes).length > 0) {
                  dispatch(getSampleImageSize());
                  dispatch(afterLogin(loginInfo.loginRes));
              } else {
                  dispatch(signOut());
              }
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

export function signOut() {
    return { type: "SIGNOUT" }
}

