import fetch from 'isomorphic-fetch';
import { assign } from 'lodash';
import { unselectShapes } from './sampleview';

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
  console.error('REQUEST FAILED', error);
}

export function getInitialState(userInControl) {
  return function (dispatch) {
    const state = {};

    const uiproperties = fetch('mxcube/api/v0.1/uiproperties', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const queue = fetch('mxcube/api/v0.1/queue/queue_state', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const beamInfo = fetch('mxcube/api/v0.1/beamline/beam/info', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const beamlineSetup = fetch('mxcube/api/v0.1/beamline/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const sampleVideoInfo = fetch('mxcube/api/v0.1/sampleview/camera', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const diffractometerInfo = fetch('mxcube/api/v0.1/diffractometer/info', {
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
    const taskParameters = fetch('mxcube/api/v0.1/queue/available_tasks', {
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
    const workflow = fetch('mxcube/api/v0.1/workflow/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const gphl_workflow = fetch('mxcube/api/v0.1/gphl_workflow/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const log = fetch('mxcube/api/v0.1/log', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const serverMode = fetch('mxcube/api/v0.1/application_settings', {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });

    const pchains = [
      uiproperties
        .then(parse)
        .then((json) => {
          state.uiproperties = json;
        })
        .catch(notify),
      queue
        .then(parse)
        .then((json) => {
          state.queue = json;
        })
        .catch(notify),
      beamInfo
        .then(parse)
        .then((json) => {
          state.beamInfo = json;
        })
        .catch(notify),
      beamlineSetup
        .then(parse)
        .then((json) => {
          state.beamlineSetup = json;
          return json;
        })
        .then((json) => {
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
      diffractometerInfo
        .then(parse)
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
      taskParameters
        .then(parse)
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
      workflow
        .then(parse)
        .then((json) => {
          state.workflow = json;
        })
        .catch(notify),
      gphl_workflow
        .then(parse)
        .then((json) => {
          state.gphl_workflow = json;
        })
        .catch(notify),
      log
        .then(parse)
        .then((json) => {
          state.logger = json;
        })
        .catch(notify),
      serverMode
        .then(parse)
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
