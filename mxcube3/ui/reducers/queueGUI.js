import { omit } from 'lodash/object';

const initialState = {
  showRestoreDialog: false,
  searchString: '',
  displayData: {},
  visibleList: 'current',
  loading: false,
  showResumeQueueDialog: false,
  showConfirmCollectDialog: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'redux-form/CHANGE': {
      if (action.form === 'search-sample') {
        return Object.assign({}, state, { searchString: action.value });
      }

      return state;
    }
    case 'SET_QUEUE': {
      const displayData = { ...state.displayData };
      const existingNodes = Object.keys(state.displayData);
      const sourceNodes = [];
      const newNodes = [];

      for (const sampleID in action.queue) {
        if (action.queue.hasOwnProperty(sampleID)) {
          action.queue[sampleID].tasks.forEach((task) => {
            if (existingNodes.indexOf(task.queueID.toString()) === -1) {
              newNodes.push(task.queueID.toString());
              displayData[task.queueID] = { collapsed: false,
                                            selected: false,
                                            progress: 0 };
            }
            sourceNodes.push(task.queueID.toString());
          });
        }
      }

      const nodesToBeRemoved = [];

      existingNodes.forEach((node) => {
        if (sourceNodes.indexOf(node) === -1) {
          nodesToBeRemoved.push(node);
        }
      });

      nodesToBeRemoved.forEach((nodeID) => {
        delete displayData[nodeID];
      });

      return { ...state, displayData };
    }
    case 'ADD_TASKS': {
      const displayData = { ...state.displayData };

      action.tasks.forEach((task) => {
        displayData[task.queueID] = { collapsed: false,
                                      selected: false,
                                      progress: 0 };
      });

      return Object.assign({}, state, { displayData });
    }
    case 'ADD_TASK_RESULT': {
      const displayData = {
        ...state.displayData,
        [action.queueID]: {
          ...state.displayData[action.queueID], progress: action.progress }
      };

      return Object.assign({}, state, { displayData });
    }

    case 'ADD_SAMPLES_TO_QUEUE': {
      const displayData = { ...state.displayData };
      action.samplesData.forEach((sample) => {
        displayData[sample.queueID] = { collpased: false,
                                        selected: false,
                                        progress: 0 };
      });

      return Object.assign({}, state, { displayData });
    }
    case 'REMOVE_TASK': {
      return Object.assign({}, state, { displayData: omit(state.displayData, action.queueID) });
    }
    case 'QUEUE_LOADING': {
      return { ...state, loading: action.loading };
    }
    // show list
    case 'SHOW_LIST':
      return {
        ...state,
        visibleList: action.list_name
      };
    case 'SHOW_RESUME_QUEUE_DIALOG': {
      return { ...state, showResumeQueueDialog: action.show };
    }
    case 'SHOW_CONFIRM_COLLECT_DIALOG': {
      return { ...state, showConfirmCollectDialog: action.show };
    }
    case 'COLLAPSE_ITEM': {
      const displayData = Object.assign({}, state.displayData);
      displayData[action.queueID].collapsed ^= true;

      return { ...state, displayData };
    }
    case 'SELECT_ITEM': {
      const displayData = Object.assign({}, state.displayData);
      displayData[action.queueID].selected ^= true;

      return { ...state, displayData };
    }
    case 'CLEAR_ALL':
      {
        return initialState;
      }
    default:
      return state;
  }
};
