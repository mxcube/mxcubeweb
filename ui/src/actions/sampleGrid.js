import { fetchLimsSamples } from '../api/lims';
import { fetchSamplesList, sendSyncWithCrims } from '../api/sampleChanger';
import { showErrorPanel } from './general';
import { setQueue } from './queue';
import { hideWaitDialog, showWaitDialog } from './waitDialog';

export function updateSampleList(sampleList, order) {
  return { type: 'UPDATE_SAMPLE_LIST', sampleList, order };
}

export function clearSampleGrid() {
  return { type: 'CLEAR_SAMPLE_GRID' };
}

export function showGenericContextMenu(show, id, x = 0, y = 0) {
  return { type: 'SHOW_GENERIC_CONTEXT_MENU', show, id, x, y };
}

export function addSamplesToList(samplesData) {
  return (dispatch, getState) => {
    // find last manually mounted sample id
    const { sampleList } = getState().sampleGrid;

    let lastSampleID = Math.max(
      ...Object.values(sampleList).map((sampleData) =>
        sampleData.location === 'Manual' ? sampleData.sampleID : 0,
      ),
      0,
    );

    for (const sampleData of samplesData) {
      if (!sampleData.sampleID) {
        lastSampleID++;
        sampleData.sampleID = lastSampleID.toString();
        sampleData.cell_no = 0;
        sampleData.puck_no = 1;
      }
    }

    dispatch({ type: 'ADD_SAMPLES_TO_LIST', samplesData });
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

export function getSamplesList() {
  return async (dispatch) => {
    dispatch(
      showWaitDialog('Please wait', 'Retrieving sample changer contents', true),
    );

    try {
      const json = await fetchSamplesList();
      const { sampleList, sampleOrder } = json;
      dispatch(updateSampleList(sampleList, sampleOrder));
      dispatch(setQueue(json));
    } catch {
      dispatch(showErrorPanel(true, 'Could not get samples list'));
    }

    dispatch(hideWaitDialog());
  };
}

export function syncSamples(lims) {
  return async (dispatch) => {
    dispatch(showWaitDialog('Please wait', 'Synchronizing with LIMS', true));

    try {
      const json = await fetchLimsSamples(lims);
      dispatch(updateSampleList(json.sampleList, json.sampleOrder));
      dispatch(setQueue(json));
    } catch (error) {
      dispatch(
        showErrorPanel(
          true,
          `Synchronization with LIMS failed ${error.response.headers.get(
            'message',
          )}`,
        ),
      );
    } finally {
      dispatch(hideWaitDialog());
    }
  };
}

// update list crystal from crims
export function updateCrystalList(crystalList) {
  return { type: 'UPDATE_CRYSTAL_LIST', crystalList };
}

export function syncWithCrims() {
  return async (dispatch) => {
    try {
      const crystalList = await sendSyncWithCrims();
      dispatch(updateCrystalList(crystalList));
    } catch (error) {
      dispatch(
        showErrorPanel(
          true,
          `Synchronization with Crims failed ${error.response.headers.get(
            'message',
          )}`,
        ),
      );
    }
  };
}

export function toggleMovableAction(key) {
  return { type: 'TOGGLE_MOVABLE_SAMPLE', key };
}
