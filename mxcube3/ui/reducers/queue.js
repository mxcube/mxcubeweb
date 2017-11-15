import update from 'react/lib/update';
import { QUEUE_STOPPED, CLICK_CENTRING } from '../constants';

const initialState = {
  queue: [],
  current: { sampleID: null, running: false },
  queueStatus: QUEUE_STOPPED,
  autoMountNext: false,
  autoAddDiffPlan: false,
  centringMethod: CLICK_CENTRING,
  numSnapshots: 4,
  groupFolder: ''
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_QUEUE': {
      return Object.assign({}, { ...state, queue: Object.keys(action.queue) });
    }
    case 'CLEAR_QUEUE': {
      return Object.assign({}, state, { queue: initialState.queue,
                                        current: initialState.current });
    }
    case 'ADD_SAMPLES_TO_QUEUE': {
      const sampleIDList = action.samplesData.map((s) => s.sampleID);
      return Object.assign({}, state, { queue: state.queue.concat(sampleIDList) });
    }
    case 'SET_QUEUE_STATUS':
      return {
        ...state,
        queueStatus: action.queueState
      };
    case 'REMOVE_SAMPLES_FROM_QUEUE': {
      const queue = state.queue.filter((value) => !action.sampleIDList.includes(value));

      return Object.assign({}, state, { queue });
    }
    case 'SET_CURRENT_SAMPLE':
      return Object.assign({}, state,
        {
          current: { ...state.current, sampleID: action.sampleID, running: false },
        }
      );
    case 'CLEAR_CURRENT_SAMPLE':
      return Object.assign({}, state,
        {
          current: { sampleID: null, collapsed: false, running: false },
        }
      );
    case 'RUN_SAMPLE':
      return Object.assign({}, state, { current: { ...state.current, running: true } });
    case 'TOGGLE_CHECKED': {
      const queue = Object.assign({}, state.queue);
      queue[action.sampleID][action.taskIndex].checked ^= true;

      return { ...state, queue };
    }
    case 'CHANGE_SAMPLE_ORDER':
      return {
        ...state,
        [action.listName]: { ...state[action.listName],
                    sampleIDs: update(state[action.listName].sampleIDs, {
                      $splice: [
                            [action.oldIndex, 1],
                            [action.newIndex, 0, state[action.listName].sampleIDs[action.oldIndex]]
                      ] }) }
      };
    case 'SET_AUTO_MOUNT_SAMPLE': {
      return { ...state, autoMountNext: action.automount };
    }
    case 'SET_AUTO_ADD_DIFFPLAN': {
      return { ...state, autoAddDiffPlan: action.autoadd };
    }
    case 'SET_CENTRING_METHOD': {
      return { ...state, centringMethod: action.centringMethod };
    }
    case 'SET_NUM_SNAPSHOTS': {
      return { ...state, numSnapshots: action.n };
    }
    case 'SET_GROUP_FOLDER': {
      return { ...state, groupFolder: action.path };
    }
    case 'CLEAR_ALL':
      {
        return Object.assign({}, state, { ...initialState, autoMountNext: state.autoMountNext });
      }
    case 'QUEUE_STATE':
      {
        return Object.assign({}, state, ...action.queueState);
      }
    case 'SET_INITIAL_STATE':
      {
        return {
          ...state,
          rootPath: action.data.beamlineSetup.path,
          queue: Object.keys(action.data.queue.queue),
          groupFolder: action.data.queue.groupFolder,
          autoMountNext: action.data.queue.autoMountNext,
          autoAddDiffPlan: action.data.queue.autoAddDiffPlan,
          numSnapshots: action.data.queue.numSnapshots,
          centringMethod: action.data.queue.centringMethod,
          current: { sampleID: action.data.queue.loaded,
                     running: action.data.queue.queueStatus }
        };
      }
    default:
      return state;
  }
};
