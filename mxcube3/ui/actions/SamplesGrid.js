import fetch from 'isomorphic-fetch';

export function pickAllAction(picked) {
  return { type: 'PICK_ALL_SAMPLES', picked };
}


export function selectAction(indices) {
  return { type: 'SELECT_SAMPLES', indices };
}


export function filterAction(filterText) {
  return { type: 'FILTER_SAMPLE_LIST', filterText };
}


export function setSamplesInfoAction(sampleInfoList) {
  return { type: 'SET_SAMPLES_INFO', sampleInfoList };
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


export function pickSamplesAction(keys) {
  return { type: 'PICK_SAMPLES', keys };
}
