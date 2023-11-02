/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/prefer-await-to-then */

import fetch from 'isomorphic-fetch';
import { showErrorPanel, setLoading, getInitialState } from './general';
import { serverIO } from '../serverIO'; // eslint-disable-line import/no-cycle
import { fetchLoginInfo, logIn, signOut } from '../api/login';

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

export function getLoginInfo() {
  return (dispatch) =>
    fetchLoginInfo().then(
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

export function doLogIn(proposal, password, navigate) {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return (dispatch) => {
    const previousUser = localStorage.getItem('currentUser');
    if (serverIO.hwrSocket !== null && serverIO.hwrSocket.connected) {
      console.log(serverIO.hwrSocket.connected); // eslint-disable-line no-console
    } else {
      serverIO.connect();
    }

    logIn(proposal, password, previousUser).then(
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
    localStorage.setItem('currentUser', '');

    dispatch({ type: 'SIGNOUT' });
  };
}

export function doSignOut(navigate) {
  return (dispatch) => {
    serverIO.disconnect();
    localStorage.setItem('currentUser', '');

    return signOut().then(() => {
      dispatch({ type: 'SIGNOUT' });
      dispatch(getLoginInfo());

      if (navigate) {
        navigate('/login');
      }
    });
  };
}
