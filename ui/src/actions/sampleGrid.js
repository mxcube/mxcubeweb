import fetch from 'isomorphic-fetch';
import { setLoading, showErrorPanel } from './general';
import { setQueue } from './queue';

export function updateSampleList(sampleList, order) {
  return { type: 'UPDATE_SAMPLE_LIST', sampleList, order };
}

export function clearSampleGrid() {
  return { type: 'CLEAR_SAMPLE_GRID' };
}

export function showGenericContextMenu(show, id, x = 0, y = 0) {
  return {
    type: 'SHOW_GENERIC_CONTEXT_MENU',
    show,
    id,
    x,
    y,
  };
}

export function addSamplesToList(samplesData) {
  return function (dispatch, getState) {
    // find last manually mounted sample id
    const { sampleList } = getState().sampleGrid;

    let lastSampleID = Math.max(
      ...Object.values(sampleList).map((sampleData) =>
        sampleData.location === 'Manual' ? sampleData.sampleID : 0
      ),
      0
    );

    for (const sampleData of samplesData) {
      if (!sampleData.sampleID) {
        lastSampleID++;
        sampleData.sampleID = lastSampleID.toString();
        sampleData.cell_no = 1
        sampleData.puck_no = 1
      }
    }

    dispatch({ type: 'ADD_SAMPLES_TO_LIST', samplesData });
  };
}

export function setSampleOrderAction(order) {
  return { type: 'SET_SAMPLE_ORDER', order };
}

export function sendSetSampleOrderAction(sampleOrder) {
  return function (dispatch) {
    fetch('mxcube/api/v0.1/queue/sample-order', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ sampleOrder }),
    }).then((response) => {
      if (response.status >= 400) {
        throw new Error('Could not set sample order');
      } else {
        dispatch(setSampleOrderAction(sampleOrder));
      }
    });
  };
}

export function selectSamplesAction(keys, selected = true) {
  return { type: 'SELECT_SAMPLES', keys, selected };
}

export function toggleSelectedAction(sampleID) {
  return { type: 'TOGGLE_SELECTED_SAMPLE', sampleID };
}

export function setViewModeAction(mode) {
  return { type: 'SET_VIEW_MODE', mode };
}

export function filterAction(filterOptions) {
  return { type: 'FILTER_SAMPLE_LIST', filterOptions };
}

export function setSamplesInfoAction(sampleInfoList) {
  return { type: 'SET_SAMPLES_INFO', sampleInfoList };
}

export function sendGetSampleList() {
  return function (dispatch) {
    dispatch(
      setLoading(
        true,
        'Please wait',
        'Retrieving sample changer contents',
        true
      )
    );
    return fetch('mxcube/api/v0.1/sample_changer/samples_list', {
      credentials: 'include',
    })
      .then((response) => response.json())
      .then(
        (res) => {
          const { sampleList } = res;
          const { sampleOrder } = res;

          dispatch(updateSampleList(sampleList, sampleOrder));
          dispatch(setQueue(res));
          dispatch(setLoading(false));
        },
        () => {
          dispatch(setLoading(false));
          dispatch(showErrorPanel(true, 'Could not get samples list'));
        }
      );
  };
}

export function sendSyncSamples() {
  return function (dispatch) {
    dispatch(setLoading(true, 'Please wait', 'Synchronizing with ISPyB', true));
    fetch('mxcube/api/v0.1/lims/synch_samples', { credentials: 'include' })
      .then((response) => {
        let result = '';

        if (response.status >= 400) {
          dispatch(setLoading(false));
          dispatch(
            showErrorPanel(
              true,
              `Synchronization with ISPyB failed ${response.headers.get(
                'message'
              )}`
            )
          );
        } else {
          result = response.json();
        }

        return result;
      })
      .then(
        (json) => {
          const { sampleList } = json;
          const { sampleOrder } = json;

          dispatch(updateSampleList(sampleList, sampleOrder));
          dispatch(setQueue(json));
          dispatch(setLoading(false));
        },
        () => {
          dispatch(setLoading(false));
          dispatch(showErrorPanel(true, 'Synchronization with ISPyB failed'));
        }
      );
  };
}

export function toggleMovableAction(key) {
  return { type: 'TOGGLE_MOVABLE_SAMPLE', key };
}
