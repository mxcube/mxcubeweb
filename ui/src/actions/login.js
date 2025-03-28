/* eslint-disable promise/prefer-await-to-then */
import { fetchBeamInfo, fetchBeamlineSetup } from '../api/beamline';
import { fetchDetectorInfo } from '../api/detector';
import { fetchDiffractometerInfo } from '../api/diffractometer';
import { fetchHarvesterInitialState } from '../api/harvester';
import { sendSelectProposal } from '../api/lims';
import { fetchLogMessages } from '../api/log';
import { sendSignOut } from '../api/login';
import { fetchLoginInfo, sendLogIn } from '../api/loginBase';
import { fetchApplicationSettings, fetchUIProperties } from '../api/main';
import { fetchAvailableTasks, fetchQueueState } from '../api/queue';
import { fetchRemoteAccessState } from '../api/remoteAccess';
import { fetchSampleChangerInitialState } from '../api/sampleChanger';
import { fetchImageData, fetchShapes } from '../api/sampleview';
import { fetchAvailableWorkflows } from '../api/workflow';
import { applicationFetched, showErrorPanel } from './general';

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

export function setInitialState(data) {
  return { type: 'SET_INITIAL_STATE', data };
}

export function selectProposal(number) {
  return async (dispatch) => {
    try {
      await sendSelectProposal(number);
      dispatch(hideProposalsForm());
      dispatch(getLoginInfo());
    } catch {
      dispatch(showErrorPanel(true, 'Server refused to select proposal'));
    }
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
    const res = await sendLogIn(proposal, password);

    if (res.msg !== '') {
      dispatch(showErrorPanel(true, res.msg));
      return;
    }

    dispatch(showErrorPanel(false));
    await dispatch(getLoginInfo());
  };
}

export function signOut() {
  return async (dispatch) => {
    dispatch(setLoginInfo({ loggedIn: false })); // disconnect sockets before actually logging out (cf. `App.jsx`)
    dispatch(applicationFetched(false));

    try {
      await sendSignOut();
    } finally {
      dispatch(getLoginInfo());
    }
  };
}

export function getInitialState() {
  return async (dispatch) => {
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

    await Promise.all(pchains);

    dispatch(setInitialState(state));
    dispatch(applicationFetched(true));
  };
}

function notify(error) {
  console.error('REQUEST FAILED', error); // eslint-disable-line no-console
}
