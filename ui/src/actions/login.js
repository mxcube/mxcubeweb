/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */

import fetch from 'isomorphic-fetch';
import { fetchBeamInfo, fetchBeamlineSetup } from '../api/beamline';
import { fetchDiffractometerInfo } from '../api/diffractometer';
import { fetchLogMessages } from '../api/log';
import { fetchApplicationSettings, fetchUIProperties } from '../api/main';
import { fetchAvailableWorkflows } from '../api/workflow';
import { fetchAvailableTasks, fetchQueueState } from '../api/queue';

import { showErrorPanel, setLoading, applicationFetched } from './general';
import { fetchLoginInfo, sendLogIn, sendSignOut } from '../api/login';
import { fetchDetectorInfo } from '../api/detector';
import { fetchSampleChangerInitialState } from '../api/sampleChanger';
import { fetchHarvesterInitialState } from '../api/harvester';
import { fetchImageData, fetchShapes } from '../api/sampleview';
import { fetchRemoteAccessState } from '../api/remoteAccess';

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
    dispatch(setLoginInfo(loginInfo));
  };
}

export function logIn(proposal, password) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    const res = await sendLogIn(proposal, password);

    if (res.msg !== '') {
      dispatch(showErrorPanel(true, res.msg));
      dispatch(setLoading(false));
      return;
    }

    dispatch(showErrorPanel(false));
    await dispatch(getLoginInfo());
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
      dispatch(applicationFetched(false));
    });
  };
}

export function getInitialState(navigate) {
  return (dispatch) => {
    const state = {};

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
      fetchImageData()
        .then((json) => {
          state.Camera = json;
        })
        .catch(notify),
      fetchDiffractometerInfo()
        .then((json) => {
          Object.assign(state, json);
        })
        .catch(notify),
      fetchDetectorInfo()
        .then((json) => {
          state.detector = json;
        })
        .catch(notify),
      fetchAvailableTasks()
        .then((json) => {
          state.taskParameters = json;
        })
        .catch(notify),
      fetchShapes()
        .then((json) => {
          state.shapes = json.shapes;
        })
        .catch(notify),
      fetchSampleChangerInitialState()
        .then((json) => {
          const {
            state: initialState,
            contents,
            loaded_sample,
            cmds,
            global_state,
          } = json;

          state.sampleChangerState = { state: initialState };
          state.sampleChangerContents = contents;
          state.loadedSample = loaded_sample;
          state.sampleChangerCommands = cmds;
          state.sampleChangerGlobalState = global_state;
        })
        .catch(notify),
      fetchHarvesterInitialState()
        .then((json) => {
          const { state: initialState, contents, cmds, global_state } = json;
          state.harvesterState = { state: initialState };
          state.harvesterContents = contents;
          state.harvesterCommands = cmds;
          state.harvesterGlobalState = global_state;
        })
        .catch(notify),
      fetchRemoteAccessState()
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

    Promise.all(pchains).then(() => {
      dispatch(setInitialState(state));
      dispatch(applicationFetched(true));
      dispatch(setLoading(false));
    });
  };
}

function notify(error) {
  console.error('REQUEST FAILED', error); // eslint-disable-line no-console
}
