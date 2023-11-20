/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable sonarjs/no-duplicate-string */
import fetch from 'isomorphic-fetch';
import { unselectShapes } from './sampleview'; // eslint-disable-line import/no-cycle
import { fetchBeamInfo, fetchBeamlineSetup } from '../api/beamline';
import { fetchDiffractometerInfo } from '../api/diffractometer';
import { fetchLogMessages } from '../api/log';
import { fetchApplicationSettings, fetchUIProperties } from '../api/main';
import { fetchAvailableWorkflows } from '../api/workflow';
import { fetchAvailableTasks, fetchQueueState } from '../api/queue';

export function addUserMessage(records, target) {
  return {
    type: 'ADD_USER_MESSAGE',
    records,
    target,
  };
}

export function removeUserMessage(messageID) {
  return { type: 'REMOVE_USER_MESSAGE', messageID };
}

export function clearAllUserMessages() {
  return { type: 'CLEAR_ALL_USER_MESSAGES' };
}

export function setInitialState(data) {
  return { type: 'SET_INITIAL_STATE', data };
}

export function applicationFetched(data) {
  return { type: 'APPLICATION_FETCHED', data };
}

export function setLoading(
  loading,
  title = '',
  message = '',
  blocking = false,
  abortFun = undefined,
) {
  return {
    type: 'SET_LOADING',
    loading,
    title,
    message,
    blocking,
    abortFun,
  };
}

export function showErrorPanel(show, message = '') {
  return {
    type: 'SHOW_ERROR_PANEL',
    show,
    message,
  };
}

export function showDialog(show, t, title = '', data = null) {
  return {
    type: 'SHOW_DIALOG',
    show,
    t,
    title,
    data,
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

export function getInitialState(userInControl) {
  return (dispatch) => {
    const state = {};

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

    let prom = Promise.all(pchains).then(() => {
      dispatch(setInitialState(state));
    });

    /* don't unselect shapes when in observer mode */
    if (userInControl) {
      prom = prom.then(() => {
        dispatch(unselectShapes({ shapes: state.shapes }));
      });
    }

    prom.then(() => {
      dispatch(applicationFetched(true));
    });
  };
}

export function showConnectionLostDialog(show = true) {
  return {
    type: 'SHOW_CONNECTION_LOST_DIALOG',
    show,
  };
}

export function showConfirmClearQueueDialog(show = true) {
  return {
    type: 'SHOW_CONFIRM_CLEAR_QUEUE_DIALOG',
    show,
  };
}

export function sendDisplayImage(path, imgNum) {
  return () => {
    fetch(
      `mxcube/api/v0.1/detector/display_image/?path=${path}&img_num=${imgNum}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        window.open(
          `https://braggy.mxcube3.esrf.fr/?file=${data.path}/image_${data.img_num}.h5.dataset`,
          'braggy',
        );
      });
  };
}
