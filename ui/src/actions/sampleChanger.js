/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */
import { showErrorPanel } from './general';
import { clearCurrentSample } from './queue'; // eslint-disable-line import/no-cycle
import {
  fetchLoadedSample,
  fetchSampleChangerContents,
  sendAbortSampleChanger,
  sendMountSample,
  sendSampleChangerCommand,
  sendScanSampleChanger,
  sendSelectContainer,
  sendUnmountCurrentSample,
  sendUnmountSample,
} from '../api/sampleChanger';

export function setContents(contents) {
  return { type: 'SET_SC_CONTENTS', data: { sampleChangerContents: contents } };
}

export function setSCState(state) {
  return { type: 'SET_SC_STATE', state };
}

export function setLoadedSample(data) {
  return { type: 'SET_LOADED_SAMPLE', data };
}

export function setSCGlobalState(data) {
  return { type: 'SET_SC_GLOBAL_STATE', data };
}

export function updateSCContents(data) {
  return { type: 'UPDATE_SC_CONTENTS', data };
}

export function setCurrentPlate(plate_index) {
  return { type: 'SET_SC_CURRENT_PLATE', plate_index };
}

export function setSelectedWell(row, col) {
  return { type: 'SET_SC_SELECTED_WELL', row, col };
}

export function setSelectedDrop(drop_index) {
  return { type: 'SET_SC_SELECTED_DROP', drop_index };
}

export function setPlate(plate_index) {
  return (dispatch) => {
    dispatch(setCurrentPlate(plate_index));
  };
}

export function selectWell(row, col) {
  return (dispatch) => {
    dispatch(setSelectedWell(row, col));
  };
}

export function selectDrop(drop_index) {
  return (dispatch) => {
    dispatch(setSelectedDrop(drop_index));
  };
}

export function refresh() {
  return (dispatch) => {
    fetchSampleChangerContents().then((json) => {
      dispatch(setContents(json));
    });

    fetchLoadedSample().then((json) => {
      dispatch(setLoadedSample(json));
    });
  };
}

export function select(address) {
  return (dispatch) => {
    sendSelectContainer(address).then((json) => {
      dispatch(setContents(json));
    });
  };
}

export function scan(address) {
  return (dispatch) => {
    sendScanSampleChanger(address).then((json) => {
      dispatch(setContents(json));
    });
  };
}

export function mountSample(sampleData, successCb = null) {
  return async (dispatch, getState) => {
    const state = getState();
    if (state.sampleChanger.loadedSample.address === sampleData.location) {
      return;
    }

    try {
      await sendMountSample(sampleData);

      if (successCb) {
        successCb();
      }
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
    }
  };
}

export function unmountSample(sample) {
  return async (dispatch) => {
    try {
      if (sample) {
        await sendUnmountSample(sample);
      } else {
        await sendUnmountCurrentSample();
      }

      dispatch(clearCurrentSample());
    } catch (error) {
      if (error.status >= 400) {
        dispatch(showErrorPanel(true, error.response.headers.get('message')));
      }
    }
  };
}

export function abort() {
  return async (dispatch) => {
    await sendAbortSampleChanger();
    dispatch(showErrorPanel(true, 'action aborted'));
  };
}

export function sendCommand(cmdparts, args) {
  return async (dispatch) => {
    try {
      await sendSampleChangerCommand(cmdparts, args);
    } catch (error) {
      if (error.status >= 400) {
        dispatch(showErrorPanel(true, error.response.headers.get('message')));
      }
    }
  };
}
