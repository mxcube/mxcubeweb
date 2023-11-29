/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable sonarjs/no-duplicate-string */

import fetch from 'isomorphic-fetch';
import { fetchBeamInfo, fetchBeamlineSetup } from '../api/beamline';
import { fetchDiffractometerInfo } from '../api/diffractometer';
import { fetchLogMessages } from '../api/log';
import { fetchApplicationSettings, fetchUIProperties } from '../api/main';
import { fetchAvailableWorkflows } from '../api/workflow';
import { fetchAvailableTasks, fetchQueueState } from '../api/queue';

import { showErrorPanel, setLoading, applicationFetched } from './general';
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

export function setInitialState(data) {
  return { type: 'SET_INITIAL_STATE', data };
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
    const loginInfo = await fetchLoginInfo();
    if (!loginInfo.loggedIn) {
      dispatch(resetLoginInfo());
      throw new Error('Not authenticated');
    }
    dispatch(setLoginInfo(loginInfo));
  };
}

export function logIn(proposal, password) {
  return (dispatch) => {
    return sendLogIn(proposal, password).then((res) => {
      if (res.msg === '') {
        dispatch(showErrorPanel(false));
        dispatch(getInitialState());
      } else {
        dispatch(showErrorPanel(true, res.msg));
        dispatch(setLoading(false));
      }
    });
  };
}

export function forcedSignout() {
  return (dispatch) => {
    dispatch({ type: 'SIGNOUT' });
  };
}

export function signOut() {
  return (dispatch) => {
    return sendSignOut().then(() => {
      dispatch({ type: 'SIGNOUT' });
      dispatch(resetLoginInfo());
    });
  };
}

export function getInitialState(navigate) {
  return async (dispatch) => {
    const state = {};

    await dispatch(getLoginInfo());

    const sampleVideoInfo = fetch('mxcube/api/v0.1/sampleview/camera', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const detectorInfo = fetch('mxcube/api/v0.1/detector/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const savedShapes = fetch('mxcube/api/v0.1/sampleview/shapes', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const sampleChangerInitialState = fetch(
      'mxcube/api/v0.1/sample_changer/get_initial_state',
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
        },
      },
    );
    const remoteAccess = fetch('mxcube/api/v0.1/ra/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });

    const pchains = [
      fetchUIProperties()
        .then((json) => {
          state.uiproperties = json;
        })
        .catch(notify),
      fetchQueueState()
        .then((json) => {
          state.queue = json;
        })
        .catch(notify),
      fetchBeamInfo()
        .then((json) => {
          state.beamInfo = json;
        })
        .catch(notify),
      fetchBeamlineSetup()
        .then((json) => {
          state.beamlineSetup = json;
          state.datapath = json.path;
          return json;
        })
        .catch(notify),
      sampleVideoInfo
        .then(parse)
        .then((json) => {
          state.Camera = json;
        })
        .catch(notify),
      fetchDiffractometerInfo()
        .then((json) => {
          Object.assign(state, json);
        })
        .catch(notify),
      detectorInfo
        .then(parse)
        .then((json) => {
          state.detector = json;
        })
        .catch(notify),
      fetchAvailableTasks()
        .then((json) => {
          state.taskParameters = json;
        })
        .catch(notify),
      savedShapes
        .then(parse)
        .then((json) => {
          state.shapes = json.shapes;
        })
        .catch(notify),
      sampleChangerInitialState
        .then(parse)
        .then((json) => {
          state.sampleChangerState = { state: json.state };
          return json;
        })
        .then((json) => {
          state.sampleChangerContents = json.contents;
          return json;
        })
        .then((json) => {
          state.loadedSample = json.loaded_sample;
          return json;
        })
        .then((json) => {
          state.sampleChangerCommands = json.cmds;
          return json;
        })
        .then((json) => {
          state.sampleChangerGlobalState = json.global_state;
          return json;
        })
        .catch(notify),
      remoteAccess
        .then(parse)
        .then((json) => {
          state.remoteAccess = json.data;
        })
        .catch(notify),
      fetchAvailableWorkflows()
        .then((json) => {
          state.workflow = json;
        })
        .catch(notify),
      fetchLogMessages()
        .then((json) => {
          state.logger = json;
        })
        .catch(notify),
      fetchApplicationSettings()
        .then((json) => {
          state.general = json;
        })
        .catch(notify),
    ];

    const prom = Promise.all(pchains).then(() => {
      dispatch(setInitialState(state));
    });

    prom.then(() => {
      dispatch(applicationFetched(true));
    });
  };
}

function parse(response) {
  if (response.status >= 200 && response.status < 300) {
    return response.json();
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function notify(error) {
  console.error('REQUEST FAILED', error); // eslint-disable-line no-console
}
