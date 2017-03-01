import fetch from 'isomorphic-fetch';
import { showErrorPanel, setLoading, getInitialState } from './general';
import { sendClearQueue } from './queue';
import { setMaster } from './remoteAccess';
import { browserHistory }  from 'react-router';

export function setLoginInfo(loginInfo) {
  return {
    type: 'SET_LOGIN_INFO',
    loginInfo
  };
}

export function startSession() {
  return function (dispatch, getState) {
    const loginInfo = getState().login.loginInfo;
    dispatch(setMaster(loginInfo.master, loginInfo.observerName));
    dispatch(getInitialState());
    dispatch(setLoading(false));
  }
}

export function getLoginInfo() {
  return function (dispatch) {
    return fetch('mxcube/api/v0.1/login_info', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => response.json())
          .then(loginInfo => {
            dispatch(setLoginInfo(loginInfo));
          }, () => {
            dispatch(showErrorPanel(true));
            dispatch(setLoading(false));
          });
  };
}

export function signOut() {
  return { type: 'SIGNOUT' };
}

export function signIn(proposal, password) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ proposal, password })
    }).then(response => response.json()).then((res) => {
      if (res.code === 'ok') {
        dispatch(showErrorPanel(false));
        browserHistory.push("/");
      } else {
        //const msg = res.msg;
        dispatch(showErrorPanel(true));
        dispatch(setLoading(false));
      }       
    }, () => {
      dispatch(showErrorPanel(true));
      dispatch(setLoading(false));
    });
  };
}

export function doSignOut() {
  return function (dispatch) {
    return fetch('mxcube/api/v0.1/signout', {
      credentials: 'include'
    }).then(() => {
      dispatch(signOut());
      dispatch(sendClearQueue());
      browserHistory.push("/login");
    });
  };
}

