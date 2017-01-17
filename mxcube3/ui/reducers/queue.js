import { omit } from 'lodash/object';
import update from 'react/lib/update';
import { QUEUE_STOPPED, SAMPLE_UNCOLLECTED } from '../constants';

const initialState = {
  queue: {},
  current: { node: null, running: false },
  searchString: '',
  queueStatus: QUEUE_STOPPED,
  showResumeQueueDialog: false,
  visibleList: 'current'
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_QUEUE': {
      const queue = {};
      action.queue.forEach(sample => { queue[sample.sampleID] = sample; });
      return Object.assign({}, initialState, { queue });
    }
    case 'ADD_TASK_RESULT': {
      const queue = {
        ...state.queue,
        [action.sampleID]: {
          ...state.queue[action.sampleID],
          tasks: [
            ...state.queue[action.sampleID].tasks.slice(0, action.taskIndex),
            {
              ...state.queue[action.sampleID].tasks[action.taskIndex],
              checked: false,
              limsResultData: action.limsResultData,
              state: action.state
            },
            ...state.queue[action.sampleID].tasks.slice(action.taskIndex + 1)
          ]
        }
      };

      const current = { ...state.current, node: action.sampleID };

      return Object.assign({}, state, { queue, current });
    }
    case 'CLEAR_QUEUE': {
      return Object.assign({}, state, { queue: {} });
    }
    case 'ADD_SAMPLES_TO_QUEUE': {
      const samplesData = {};

      action.samplesData.forEach((sample) => {
        samplesData[sample.sampleID] = { ...sample, state: 0 };
      });

      return Object.assign({}, state, { queue: { ...state.queue, ...samplesData } });
    }

    // Setting state
    case 'SET_QUEUE_STATUS':
      return {
        ...state,
        queueStatus: action.queueState
      };

    case 'REMOVE_SAMPLES_FROM_QUEUE': {
      let queue = { ...state.queue };

      for (const sampleID of action.sampleIDList) {
        queue = omit(state.queue, sampleID);
      }

      return Object.assign({}, state, { queue });
    }
    // Adding the new task to the queue
    case 'ADD_TASKS': {
      const queue = { ...state.queue };

      action.tasks.forEach((t) => {
        const task = { ...t, state: 0 };

        if (task.parameters.prefix === '') {
          task.parameters.prefix = queue[task.sampleID].defaultPrefix;
        }

        queue[task.sampleID] = {
          ...queue[task.sampleID],
          tasks: [...queue[task.sampleID].tasks, task],
          state: SAMPLE_UNCOLLECTED
        };
      });

      return Object.assign({}, state, { queue });
    }
    // Removing the task from the queue
    case 'REMOVE_TASK': {
      const queue = {
        ...state.queue,
        [action.sampleID]: {
          ...state.queue[action.sampleID],
          tasks: [...state.queue[action.sampleID].tasks.slice(0, action.taskIndex),
                  ...state.queue[action.sampleID].tasks.slice(action.taskIndex + 1)]
        }
      };

      return Object.assign({}, state, { queue });
    }
    case 'UPDATE_TASK': {
      const queue = {
        ...state.queue,
        [action.sampleID]: {
          ...state.queue[action.sampleID],
          tasks:
          [
            ...state.queue[action.sampleID].tasks.slice(0, action.taskIndex),
            action.taskData,
            ...state.queue[action.sampleID].tasks.slice(action.taskIndex + 1)
          ]
        }
      };

      return Object.assign({}, state, { queue });
    }
    // Run Mount, this will add the mounted sample to history
    case 'SET_CURRENT_SAMPLE':
      return Object.assign({}, state,
        {
          current: { ...state.current, node: action.sampleID, running: false },
        }
      );
    case 'CLEAR_CURRENT_SAMPLE':
      return Object.assign({}, state,
        {
          current: { node: null, collapsed: false, running: false },
          history: [...state.history, state.current.node]
        }
      );
        // Run Sample
    case 'RUN_SAMPLE':
      return Object.assign({}, state, { current: { ...state.current, running: true } });
    case 'TOGGLE_CHECKED': {
      const queue = Object.assign({}, state.queue);
      queue[action.sampleID][action.taskIndex].checked ^= true;

      return { ...state, queue };
    }
     // show list
    case 'SHOW_LIST':
      return {
        ...state,
        visibleList: action.list_name
      };
    // Change order of samples in queue on drag and drop
    case 'CHANGE_QUEUE_ORDER':

      return {
        ...state,
        [action.listName]: { ...state[action.listName],
                    nodes: update(state[action.listName].nodes, {
                      $splice: [
                            [action.oldIndex, 1],
                            [action.newIndex, 0, state[action.listName].nodes[action.oldIndex]]
                      ] }) }
      };

    // Change order of samples in queue on drag and drop
    case 'CHANGE_METHOD_ORDER': {
      const queue = Object.assign({}, state.queue);

      queue[action.sampleId].tasks = update(state.queue[action.sampleId].tasks,
        {
          $splice: [[action.oldIndex, 1],
          [action.newIndex, 0,
          state.queue[action.sampleId].tasks[action.oldIndex]]]
        });
      return { ...state, queue };
    }
    case 'redux-form/CHANGE':
      if (action.form === 'search-sample') {
        return Object.assign({}, state, { searchString: action.value });
      }
      return state;
    case 'CLEAR_ALL':
      {
        return Object.assign({}, state, { ...initialState });
      }
    case 'SHOW_RESUME_QUEUE_DIALOG':
      {
        return { ...state, showResumeQueueDialog: action.show };
      }
    case 'QUEUE_STATE':
      {
        return Object.assign({}, state, ...action.queueState);
      }
    case 'SET_INITIAL_STATE':
      {
        return {
          ...state,
          rootPath: action.data.rootPath,
          queue: action.data.queue.queue,
          current: { node: action.data.queue.loaded, running: false }
        };
      }
    default:
      return state;
  }
};
