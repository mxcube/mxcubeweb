/* eslint-disable promise/prefer-await-to-then */
import { fetchValue } from '../api/hardware-object';
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
import { fetchGetAllActions } from './beamlineActions';
import { applicationFetched, showErrorPanel } from './general';

function setLoginInfo(loginInfo) {
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

function setInitialState(data) {
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
    const initialStateSlices = await Promise.all([
      fetchUIProperties()
        .then((uiproperties) => ({ uiproperties }))
        .catch(notify),
      fetchQueueState()
        .then((queue) => ({ queue }))
        .catch(notify),
      fetchValue('beam', 'beam')
        .then((beamInfo) => ({ beamInfo: beamInfo.value }))
        .catch(notify),
      fetchValue('beamline', 'beamline')
        .then((beamlineSetup) => ({
          beamlineSetup,
          datapath: beamlineSetup.path,
        }))
        .catch(notify),
      fetchGetAllActions()
        .then((actionsList) => actionsList)
        .catch(notify),
      fetchImageData()
        .then((camera) => ({ camera }))
        .catch(notify),
      fetchValue('diffractometer', 'diffractometer')
        .then((diffractometer) => ({ diffractometer }))
        .catch(notify),
      fetchValue('detector', 'detector')
        .then((detector) => ({ detector }))
        .catch(notify),
      fetchAvailableTasks()
        .then((taskParameters) => ({ taskParameters }))
        .catch(notify),
      fetchShapes()
        .then((json) => ({ shapes: json.shapes }))
        .catch(notify),
      fetchSampleChangerInitialState()
        .then((json) => {
          const { state, contents, loaded_sample, cmds, global_state } = json;
          return {
            sampleChangerState: { state },
            sampleChangerContents: contents,
            loadedSample: loaded_sample,
            sampleChangerCommands: cmds,
            sampleChangerGlobalState: global_state,
          };
        })
        .catch(notify),
      fetchHarvesterInitialState()
        .then((json) => {
          const { state, contents, cmds, global_state } = json;
          return {
            harvesterState: { state },
            harvesterContents: contents,
            harvesterCommands: cmds,
            harvesterGlobalState: global_state,
          };
        })
        .catch(notify),
      fetchRemoteAccessState()
        .then((json) => ({ remoteAccess: json.data }))
        .catch(notify),
      fetchAvailableWorkflows()
        .then((workflow) => ({ workflow }))
        .catch(notify),
      fetchLogMessages()
        .then((logger) => ({ logger }))
        .catch(notify),
      fetchApplicationSettings()
        .then((general) => ({ general }))
        .catch(notify),
    ]);

    dispatch(setInitialState(Object.assign({}, ...initialStateSlices)));
    dispatch(applicationFetched(true));
  };
}

function notify(error) {
  console.error('REQUEST FAILED', error); // eslint-disable-line no-console
  return {};
}
