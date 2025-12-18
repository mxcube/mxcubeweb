import { omit } from 'lodash/object';

const INITIAL_STATE = {
  showRestoreDialog: false,
  searchString: '',
  displayData: {},
  visibleList: 'current',
  loading: false,
  showResumeQueueDialog: false,
  showConfirmCollectDialog: false,
};

function queueGUIReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'redux-form/CHANGE': {
      if (action.form === 'search-sample') {
        return { ...state, searchString: action.value };
      }

      return state;
    }
    case 'SET_QUEUE': {
      const displayData = { ...state.displayData };
      const existingNodes = Object.keys(state.displayData);
      action.sampleOrder.forEach((sampleID) => {
        if (sampleID in action.sampleList) {
          action.sampleList[sampleID].tasks.forEach((task) => {
            if (!existingNodes.includes(task.queueID.toString())) {
              displayData[task.queueID] = {
                collapsed: false,
                selected: false,
                progress: 0,
              };
            }
          });
        }
      });

      return { ...state, displayData };
    }
    case 'ADD_TASKS': {
      const displayData = { ...state.displayData };

      action.tasks.forEach((task) => {
        displayData[task.queueID] = {
          collapsed: false,
          selected: false,
          progress: 0,
        };
      });

      return { ...state, displayData };
    }
    case 'ADD_TASK_RESULT': {
      const displayData = {
        ...state.displayData,
        [action.queueID]: {
          ...state.displayData[action.queueID],
          progress: action.progress,
        },
      };

      return { ...state, displayData };
    }
    case 'REMOVE_TASK': {
      return { ...state, displayData: omit(state.displayData, action.queueID) };
    }
    case 'REMOVE_TASKS_LIST': {
      return {
        ...state,
        displayData: omit(state.displayData, action.queueIDList),
      };
    }
    case 'QUEUE_LOADING': {
      return { ...state, loading: action.loading };
    }
    // show list
    case 'SHOW_LIST': {
      return {
        ...state,
        visibleList: action.list_name,
      };
    }
    case 'SHOW_RESUME_QUEUE_DIALOG': {
      return { ...state, showResumeQueueDialog: action.show };
    }
    case 'SHOW_CONFIRM_COLLECT_DIALOG': {
      return { ...state, showConfirmCollectDialog: action.show };
    }
    case 'COLLAPSE_ITEM': {
      const { displayData } = state;
      const { queueID } = action;

      return {
        ...state,
        displayData: {
          ...displayData,
          [queueID]: {
            ...displayData[queueID],
            collapsed: !displayData[queueID].collapsed,
          },
        },
      };
    }
    case 'SELECT_ITEM': {
      const { displayData } = state;
      const { queueID } = action;

      return {
        ...state,
        displayData: {
          ...displayData,
          [queueID]: {
            ...displayData[queueID],
            selected: !displayData[queueID].selected,
          },
        },
      };
    }
    case 'SET_INITIAL_STATE': {
      const sampleList = { ...action.data.queue.sampleList.sampleList };
      const sampleOrder = [...action.data.queue.sampleList.sampleOrder];
      const displayData = { ...state.displayData };
      const existingNodes = Object.keys(state.displayData);

      sampleOrder.forEach((sampleID) => {
        if (sampleID in sampleList) {
          sampleList[sampleID].tasks.forEach((task) => {
            if (!existingNodes.includes(task.queueID.toString())) {
              displayData[task.queueID] = {
                collapsed: false,
                selected: false,
                progress: 0,
              };
            }
          });
        }
      });

      return { ...state, displayData };
    }
    default: {
      return state;
    }
  }
}

export default queueGUIReducer;
