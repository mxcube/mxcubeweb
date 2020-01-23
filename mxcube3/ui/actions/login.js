import fetch from 'isomorphic-fetch';
import { showErrorPanel, setLoading, getInitialState } from './general';
import { clearAll } from './queue';
import { setMaster } from './remoteAccess';
import { browserHistory } from 'react-router';

export function setLoginInfo(loginInfo) {
  return {
    type: 'SET_LOGIN_INFO',
    loginInfo
  };
}

export function showProposalsForm() {
  return {
    type: 'SHOW_PROPOSALS_FORM',
  };
}

export function hideProposalsForm() {
  return {
    type: 'HIDE_PROPOSALS_FORM'
  };
}

export function showForceLogoutDialog(show = true) {
  return {
    type: 'SHOW_FORCE_LOGOUT_DIALOG', show
  };
}

export function selectProposal(prop) {
  return {
    type: 'SELECT_PROPOSAL',
    proposal: prop,
  };
}

export function unselectProposal() {
  return {
    type: 'UNSELECT_PROPOSAL',
  };
}

export function sendMail(sender, content) {
  fetch('mxcube/api/v0.1/send_feedback', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ sender, content })
  });
}


export function postProposal(number) {
  return fetch('mxcube/api/v0.1/lims/proposal', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json'
    },
    body: JSON.stringify({ proposal_number: number })
  });
}

export function sendSelectProposal(number) {
  return function (dispatch) {
    postProposal(number).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to select proposal'));
        browserHistory.push('/login');
      } else {
        browserHistory.push('/');
      }
    });
  };
}

export function startSession() {
  return function (dispatch, getState) {
    const loginInfo = getState().login.loginInfo;
    dispatch(setMaster(loginInfo.master, loginInfo.observerName));
    dispatch(getInitialState());
    dispatch(setLoading(false));
  };
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
            return loginInfo;
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
        dispatch(getLoginInfo()).then(response => response).then((resp) => {
          const selectedProposal = resp.selectedProposal;
          if (selectedProposal) {
            browserHistory.push('/');
          } else if (resp.loginType === 'User') {
            dispatch(showProposalsForm());
          } else {
            dispatch(selectProposal(proposal));
            browserHistory.push('/');
          }
        });
      } else {
        const msg = res.msg;
        dispatch(showErrorPanel(true, msg));
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
      dispatch(clearAll());
      browserHistory.push('/login');
    });
  };
}


export function sendForceUserSignOut(sid) {
  return function () {
    return fetch('mxcube/api/v0.1/forceusersignout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({ sid })
    });
  };
}


export function forceUserSignOut(sid) {
  return function (dispatch) {
    dispatch(sendForceUserSignOut(sid)).then(() => {
      dispatch(signOut());
      browserHistory.push('/login');
    });
  };
}

export function forceSignOut() {
  return function (dispatch) {
    dispatch(signOut());
    browserHistory.push('/login');
  };
}

