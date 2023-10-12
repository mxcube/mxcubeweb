import update from 'immutability-helper';
import { QUEUE_STOPPED, CLICK_CENTRING } from '../constants';
import { clearAllLastUsedParameters } from '../components/Tasks/fields';

const INITIAL_STATE = {
  queue: [],
  current: { sampleID: null, running: false },
  queueStatus: QUEUE_STOPPED,
  autoMountNext: false,
  autoAddDiffplan: false,
  rememberParametersBetweenSamples: true,
  centringMethod: CLICK_CENTRING,
  numSnapshots: 4,
  groupFolder: '',
};

function queueReducer(state = INITIAL_STATE, action = {}) {
  // eslint-disable-next-line sonarjs/max-switch-cases
  switch (action.type) {
    case 'SET_QUEUE': {
      return { ...state, queue: action.sampleOrder };
    }
    case 'CLEAR_QUEUE': {
      return {
        ...state,
        queue: INITIAL_STATE.queue,
        current: INITIAL_STATE.current,
      };
    }
    case 'ADD_SAMPLES_TO_QUEUE': {
      const sampleIDList = action.samplesData.map((s) => s.sampleID);
      return { ...state, queue: [...state.queue, ...sampleIDList] };
    }
    case 'SET_QUEUE_STATUS': {
      return {
        ...state,
        queueStatus: action.queueState,
      };
    }
    case 'REMOVE_SAMPLES_FROM_QUEUE': {
      const queue = state.queue.filter(
        (value) => !action.sampleIDList.includes(value),
      );

      return { ...state, queue };
    }
    case 'SET_CURRENT_SAMPLE': {
      if (!state.rememberParametersBetweenSamples) {
        clearAllLastUsedParameters();
      }

      return {
        ...state,
        current: {
          ...state.current,
          sampleID: action.sampleID,
          running: false,
        },
      };
    }
    case 'CLEAR_CURRENT_SAMPLE': {
      const queue = state.queue.filter(
        (value) => value !== state.current.sampleID,
      );
      return {
        ...state,
        queue,
        current: { sampleID: null, collapsed: false, running: false },
      };
    }
    case 'RUN_SAMPLE': {
      return { ...state, current: { ...state.current, running: true } };
    }
    case 'CHANGE_SAMPLE_ORDER': {
      return {
        ...state,
        [action.listName]: {
          ...state[action.listName],
          sampleIDs: update(state[action.listName].sampleIDs, {
            $splice: [
              [action.oldIndex, 1],
              [
                action.newIndex,
                0,
                state[action.listName].sampleIDs[action.oldIndex],
              ],
            ],
          }),
        },
      };
    }
    case 'SET_AUTO_MOUNT_SAMPLE': {
      return { ...state, autoMountNext: action.automount };
    }
    case 'SET_AUTO_ADD_DIFFPLAN': {
      return { ...state, autoAddDiffplan: action.autoadd };
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
    case 'SET_QUEUE_SETTING': {
      return { ...state, [action.settingName]: action.value };
    }
    case 'CLEAR_ALL': {
      return { ...state, ...INITIAL_STATE, autoMountNext: state.autoMountNext };
    }
    case 'QUEUE_STATE': {
      return Object.assign({}, state, ...action.queueState);
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        queue: action.data.queue.queue,
        groupFolder: action.data.queue.groupFolder,
        autoMountNext: action.data.queue.autoMountNext,
        autoAddDiffplan: action.data.queue.autoAddDiffplan,
        numSnapshots: action.data.queue.numSnapshots,
        centringMethod: action.data.queue.centringMethod,
        rememberParametersBetweenSamples:
          action.data.queue.rememberParametersBetweenSamples,
        current: {
          sampleID: action.data.queue.current,
          running: action.data.queue.queueStatus,
        },
      };
    }
    default: {
      return state;
    }
  }
}

export default queueReducer;
