import fetch from 'isomorphic-fetch';
import { setLoading, showErrorPanel } from './general';


export function updateSampleList(sampleList, order) {
  return { type: 'UPDATE_SAMPLE_LIST', sampleList, order };
}


export function addSamplesToList(samplesData) {
  return function (dispatch, getState) {
    // find last manually mounted sample id
    const sampleList = getState().sampleGrid.sampleList;

    let lastSampleID = Math.max(...Object.values(sampleList).map((sampleData) =>
      (sampleData.location === 'Manual' ? sampleData.sampleID : 0)
    ), 0);

    for (const sampleData of samplesData) {
      if (! sampleData.sampleID) {
        lastSampleID++;
        sampleData.sampleID = lastSampleID;
      }
    }

    dispatch({ type: 'ADD_SAMPLES_TO_LIST', samplesData });
  };
}


export function setSampleOrderAction(order) {
  return { type: 'SET_SAMPLE_ORDER', order };
}


export function selectSamplesAction(keys, selected = true) {
  return { type: 'SELECT_SAMPLES', keys, selected };
}


export function toggleSelectedAction(sampleID) {
  return { type: 'TOGGLE_SELECTED_SAMPLE', sampleID };
}


export function filterAction(filterText) {
  return { type: 'FILTER_SAMPLE_LIST', filterText };
}


export function setSamplesInfoAction(sampleInfoList) {
  return { type: 'SET_SAMPLES_INFO', sampleInfoList };
}


export function sendGetSampleList() {
  return function (dispatch) {
    dispatch(setLoading(true, 'Please wait', 'Retrieving sample changer contents', true));
    fetch('mxcube/api/v0.1/sample_changer/samples_list', { credentials: 'include' })
                        .then(response => response.json())
                        .then(res => {
                          const sampleList = res.sampleList;
                          const sampleOrder = res.sampleOrder;

                          dispatch(updateSampleList(sampleList, sampleOrder));
                          dispatch(setLoading(false));
                        }, () => {
                          dispatch(setLoading(false));
                          dispatch(showErrorPanel(true, 'Could not get samples list'));
                        });
  };
}


export function sendSyncSamples(proposalId) {
  return function (dispatch) {
    fetch(`mxcube/api/v0.1/samples/${proposalId}`, { credentials: 'include' })
            .then(response => response.json())
            .then(json => {
              dispatch(setSamplesInfoAction(json.samples_info));
            });
  };
}


export function toggleMovableAction(key) {
  return { type: 'TOGGLE_MOVABLE_SAMPLE', key };
}
