import fetch from 'isomorphic-fetch';
import { showErrorPanel, setLoading, getInitialStatus } from './general';
import { sendClearQueue } from './queue';

export function afterLogin(data) {
  if (data.status.code === 'error') {
    return { type: 'LOGIN', data: {}, status: data.status };
  }

  return { type: 'LOGIN', data, status: data.status };
}

export function setLoginInfo(loginInfo) {
  return {
    type: 'SET_LOGIN_INFO',
    loginInfo
  };
}

export function getLoginInfo() {
  return function (dispatch) {
    dispatch(getInitialStatus());
    fetch('mxcube/api/v0.1/login_info', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include'
    }).then(response => response.json())
          .then(loginInfo => {
            let storedProposal = '';
            try {
              const storedLogin = localStorage.getItem('reduxPersist:login');
              storedProposal = JSON.parse(storedLogin).data.Proposal.number;
            } catch (e) {
              // ignore any exception
            }

            dispatch(setLoginInfo(loginInfo));
            if (loginInfo.loginRes.Proposal) {
              dispatch(afterLogin(loginInfo.loginRes));
              dispatch(getInitialStatus());
              // check if proposal number is the same as the one stored
              // in local session storage, otherwise we need to do a manual
              // synchronisation
              if (loginInfo.loginRes.Proposal.number !== storedProposal) {
                  // this action has been commented... not sure what to do
                  // dispatch(synchState(loginInfo.queue));
              }
            }
          }, () => {
            throw new Error('Server connection problem (getLoginInfo)');
          });
  };
}

export function signOut() {
  return { type: 'SIGNOUT' };
}

export function doLogin(proposal, password) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ proposal, password })
    }).then(() => {
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
    fetch('mxcube/api/v0.1/signout', {
      credentials: 'include'
    }).then(() => {
      dispatch(signOut());
      dispatch(sendClearQueue());
    });
  };
}

