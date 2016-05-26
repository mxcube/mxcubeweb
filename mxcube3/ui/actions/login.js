import fetch from 'isomorphic-fetch';
import { getInitialStatus } from './general';
import { showErrorPanel, setLoading } from './general';
import { synchState } from './queue';


export function doLogin(proposal, password) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/login', {
        method: 'POST',
        headers: {
             'Accept': 'application/json',
             'Content-type': 'application/json'
           },
        credentials: 'include',
        body: JSON.stringify({ proposal, password })
      }).then(response => {
            dispatch(showErrorPanel(false));
            dispatch(setLoading(false));
            dispatch(getLoginInfo());
          }, () => {
            dispatch(showErrorPanel(true));
            dispatch(setLoading(false));
          });
  };
}

export function doSignOut() {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/signout', { credentials: 'include' }).then(dispatch(signOut()));
  };
}

export function getLoginInfo() {
  return function (dispatch) {
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
            if (loginInfo.loginRes.Proposal) {
              dispatch(afterLogin(loginInfo.loginRes));
              dispatch(getInitialStatus());
              dispatch(synchState(loginInfo.queue));
            }
          }, () => {
            throw new Error('Server connection problem (getLoginInfo)');
          });
  };
}

export function setLoginInfo(loginInfo) {
  return {
    type: 'SET_LOGIN_INFO',
    loginInfo: loginInfo
  };
}

export function afterLogin(data) {
  if (data.status.code == 'error')
    return { type: 'LOGIN', data:{ }, status: data.status };
  else
      return { type: 'LOGIN', data: data, status: data.status };
}

export function signOut() {
  return { type: 'SIGNOUT' };
}
