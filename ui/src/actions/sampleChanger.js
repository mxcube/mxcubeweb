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
import { clearCurrentSample } from '../reducers/queue';
import { setContents, setLoadedSample } from '../reducers/sampleChanger';
import { showErrorPanel } from './general';

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
