/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable sonarjs/no-duplicate-string */
import fetch from 'isomorphic-fetch';
import { showErrorPanel, setLoading, getInitialState } from './general';
import { serverIO } from '../serverIO'; // eslint-disable-line import/no-cycle

export function setLoginInfo(loginInfo) {
  return {
    type: 'SET_LOGIN_INFO',
    loginInfo,
  };
}

export function showProposalsForm() {
  return {
    type: 'SHOW_PROPOSALS_FORM',
  };
}

export function hideProposalsForm() {
  return {
    type: 'HIDE_PROPOSALS_FORM',
  };
}

export function selectProposal(prop) {
  return {
    type: 'SELECT_PROPOSAL',
    proposal: prop,
  };
}

export function sendMail(sender, content) {
  fetch('mxcube/api/v0.1/login/send_feedback', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ sender, content }),
  });
}

export function postProposal(number) {
  return fetch('mxcube/api/v0.1/lims/proposal', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ proposal_number: number }),
  });
}

export function sendSelectProposal(number, navigate) {
  return (dispatch) => {
    postProposal(number).then((response) => {
      if (response.status >= 400) {
        dispatch(showErrorPanel(true, 'Server refused to select proposal'));
        navigate('/login');
      } else {
        navigate('/');
        dispatch(selectProposal(number));
      }
    });
  };
}

export function startSession(userInControl) {
  return (dispatch) => {
    dispatch(getInitialState(userInControl));
    dispatch(setLoading(false));
  };
}

export function refreshSession() {
  return (dispatch) =>
    fetch('mxcube/api/v0.1/login/refresh_session', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      credentials: 'include',
    });
}

export function getLoginInfo() {
  return (dispatch) =>
    fetch('mxcube/api/v0.1/login/login_info', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => response.json())
      .then(
        (loginInfo) => {
          dispatch(setLoginInfo(loginInfo));
          return loginInfo;
        },
        () => {
          dispatch(showErrorPanel(true));
          dispatch(setLoading(false));
        },
      );
}

export function signOut() {
  localStorage.setItem('currentUser', '');
  return { type: 'SIGNOUT' };
}

export function signIn(proposal, password, navigate) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return (dispatch) => {
    const previousUser = localStorage.getItem('currentUser');
    if (serverIO.hwrSocket !== null && serverIO.hwrSocket.connected) {
      console.log(serverIO.hwrSocket.connected); // eslint-disable-line no-console
    } else {
      serverIO.connect();
    }

    fetch('mxcube/api/v0.1/login/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ proposal, password, previousUser }),
    })
      .then((response) => response.json())
      .then(
        (res) => {
          if (res.code === 'ok') {
            dispatch(showErrorPanel(false));
            dispatch(getLoginInfo())
              .then((response) => response)
              .then((resp) => {
                if (resp.loginType === 'User') {
                  if (resp.user.inControl) {
                    dispatch(showProposalsForm());
                  } else {
                    navigate('/');
                  }
                } else {
                  dispatch(selectProposal(proposal));
                  navigate('/');
                }
              });
          } else {
            const { msg } = res;
            dispatch(showErrorPanel(true, msg));
            dispatch(setLoading(false));
          }
        },
        () => {
          dispatch(showErrorPanel(true));
          dispatch(setLoading(false));
        },
      );
  };
}

export function forcedSignout() {
  return (dispatch) => {
    serverIO.disconnect();
    dispatch(signOut());
  };
}

export function doSignOut(navigate) {
  return (dispatch) => {
    serverIO.disconnect();
    return fetch('mxcube/api/v0.1/login/signout', {
      credentials: 'include',
    }).then(() => {
      dispatch(signOut());
      dispatch(getLoginInfo());
      if (navigate) {
        navigate('/login');
      }
    });
  };
}
