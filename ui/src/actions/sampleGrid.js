import { fetchLimsSamples, fetchSamplesList } from '../api/lims';
import { sendSyncWithCrims } from '../api/sampleChanger';
import {
  addSamples,
  updateCrystalList,
  updateSampleList,
} from '../reducers/sampleGrid';
import { hideWaitDialog, showWaitDialog } from '../reducers/waitDialog';
import { showErrorPanel } from './general';
import { setQueue } from './queue';

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

    dispatch(addSamples(samplesData));
  };
}

export function getSamplesList() {
  return async (dispatch) => {
    dispatch(
      showWaitDialog({
        title: 'Please wait',
        message: 'Retrieving sample changer contents',
        blocking: true,
      }),
    );

    try {
      const json = await fetchSamplesList();
      const { sampleList, sampleOrder } = json;
      dispatch(updateSampleList({ sampleList, order: sampleOrder }));
      dispatch(setQueue(json));
    } catch {
      dispatch(showErrorPanel(true, 'Could not get samples list'));
    }

    dispatch(hideWaitDialog());
  };
}

export function getLimsSamples(lims) {
  return async (dispatch) => {
    dispatch(
      showWaitDialog({
        title: 'Please wait',
        message: 'Synchronizing with LIMS',
        blocking: true,
      }),
    );

    try {
      const json = await fetchLimsSamples(lims);
      dispatch(
        updateSampleList({
          sampleList: json.sampleList,
          order: json.sampleOrder,
        }),
      );
      dispatch(setQueue(json));
    } catch (error) {
      dispatch(
        showErrorPanel(
          true,
          `Error while getting LIMS samples ${error.response.headers.get(
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
