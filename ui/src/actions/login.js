/* eslint-disable promise/catch-or-return */

/* eslint-disable promise/prefer-await-to-then */

import fetch from 'isomorphic-fetch';
import { showErrorPanel, setLoading } from './general';
import { serverIO } from '../serverIO'; // eslint-disable-line import/no-cycle
import { fetchLoginInfo, sendLogIn, sendSignOut } from '../api/login';

export function setLoginInfo(loginInfo) {
  return {
    type: 'SET_LOGIN_INFO',
    loginInfo,
  };
}

export function resetLoginInfo() {
  return setLoginInfo({
    beamlineName: '',
    synchrotronName: '',
    loginType: '',
    user: '',
    proposalList: [],
    selectedProposal: '',
    selectedProposalID: '',
    loggedIn: false,
    rootPath: '',
  });
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

export function getLoginInfo() {
  return async (dispatch) => {
    try {
      const loginInfo = await fetchLoginInfo();
      dispatch(setLoginInfo(loginInfo));
    } catch (error) {
      dispatch(resetLoginInfo());
      dispatch(setLoading(false));
      throw error;
    }
  };
}

export function logIn(proposal, password, navigate) {
  return (dispatch) => {
    sendLogIn(proposal, password).then(
      (res) => {
        if (res.msg === '') {
          dispatch(showErrorPanel(false));
          navigate('/');
        } else {
          dispatch(showErrorPanel(true, res.msg));
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
    dispatch({ type: 'SIGNOUT' });
  };
}

export function signOut(navigate) {
  return (dispatch) => {
    serverIO.disconnect();
    return sendSignOut().then(() => {
      dispatch({ type: 'SIGNOUT' });
      dispatch(resetLoginInfo());
      if (navigate) {
        navigate('/');
      }
    });
  };
}
