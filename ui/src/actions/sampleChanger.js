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
  return async (dispatch) => {
    const [contents, sample] = await Promise.all([
      fetchSampleChangerContents(),
      fetchLoadedSample(),
    ]);

    dispatch(setContents(contents));
    dispatch(setLoadedSample(sample));
  };
}

export function select(address) {
  return async (dispatch) => {
    const contents = await sendSelectContainer(address);
    dispatch(setContents(contents));
  };
}

export function scan(address) {
  return async (dispatch) => {
    const contents = await sendScanSampleChanger(address);
    dispatch(setContents(contents));
  };
}

export function mountSample(sampleData) {
  return async (dispatch, getState) => {
    const state = getState();
    if (state.sampleChanger.loadedSample.address === sampleData.location) {
      return;
    }

    try {
      await sendMountSample(sampleData);
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
      throw error;
    }
  };
}

export function unmountSample() {
  return async (dispatch) => {
    try {
      await sendUnmountCurrentSample();
      dispatch(clearCurrentSample());
    } catch (error) {
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
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
      dispatch(showErrorPanel(true, error.response.headers.get('message')));
    }
  };
}
