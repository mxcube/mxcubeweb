import { omit } from 'lodash/object';
import { without } from 'lodash/array';
import update from 'react/lib/update';

const initialState = {
  queue: {},
  current: { node: null, collapsed: false, running: false },
  todo: { nodes: [], collapsed: false },
  history: { nodes: [], collapsed: false },
  searchString: '',
  queueStatus: 'QueueStopped',
  showRestoreDialog: false,
  queueRestoreState: {},
  sampleList: {},
  manualMount: { set: false, id: 1 },
  displayData: {}
};


/**
 * Initalizes the list of samples
 *
 * @param {Object} samples - sampleList object (key, sample data) pairs
 * @returns {Object} - initialized sampleList object
 *
 */
function initSampleList(samples) {
  const sampleList = {};

  for (const key in samples) {
    if (key) {
      sampleList[key] = { ...samples[key], queueOrder: -1 };
    }
  }

  return sampleList;
}


/**
 * Recalculates sample queue order depedning on display order
 *
 * @param {Array} keys - keys to sort
 * @param {Object} gridOrder - Grid display order object containing (key, order) pairs
 * @param {Object} state - redux state object
 * @returns {Object} - sampleList object with queueOrder property updated
 *
 */
function recalculateQueueOrder(keys, gridOrder, state) {
  const sampleList = { ...state.sampleList };
  const sortedOrder = Object.entries(gridOrder).sort((a, b) => a[1] > b[1]);

  let i = 0;
  for (const [key] of sortedOrder) {
    if (keys.includes(key)) {
      sampleList[key] = { ...state.sampleList[key], queueOrder: i };
      i++;
    } else {
      sampleList[key] = { ...state.sampleList[key], queueOrder: -1 };
    }
  }

  return sampleList;
}

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_QUEUE': {
      return Object.assign({}, state, { queue: action.queue });
    }
    case 'SET_SAMPLE_LIST': {
      return Object.assign({}, state, { sampleList: initSampleList(action.sampleList) });
    }
    case 'APPEND_TO_SAMPLE_LIST': {
      const sampleData = action.sampleData;
      const sampleList = { ...state.sampleList };
      sampleList[sampleData.sampleID] = sampleData;

      return Object.assign({}, state, { sampleList });
    }
    case 'SET_SAMPLE_ORDER': {
      const sampleList = recalculateQueueOrder(Object.keys(state.queue), action.order, state);
      return Object.assign({}, state, { sampleList });
    }
    case 'SET_SAMPLES_INFO': {
      const samplesList = {};

      Object.keys(state.samplesList).forEach(key => {
        const sample = state.samplesList[key];
        let sampleInfo;
        for (sampleInfo of action.sampleInfoList) {
          if (sampleInfo.code) {
            // find sample with data matrix code
            if (sample.code === sampleInfo.code) {
              samplesList[key] = Object.assign({}, sample, { sample_info: sampleInfo });
              break;
            }
          } else {
            // check with sample changer location
            const containerLocation = sampleInfo.containerSampleChangerLocation;
            const sampleLocation = sampleInfo.sampleLocation;
            const limsLocation = `${containerLocation} : ${sampleLocation}`;

            if (sample.location === limsLocation) {
              samplesList[key] = Object.assign({}, sample, { sample_info: sampleInfo });
              break;
            }
          }
        }
        if (samplesList[key] === undefined) {
          samplesList[key] = Object.assign({}, sample, { sample_info: null });
        }
      });
      return Object.assign({}, state, { sampleList: samplesList });
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
            },
            ...state.queue[action.sampleID].tasks.slice(action.taskIndex + 1)
          ]
        }
      };

      const displayData = {
        ...state.displayData,
        [action.sampleID]: {
          ...state.displayData[action.sampleID],
          tasks: [
            ...state.displayData[action.sampleID].tasks.slice(0, action.taskIndex),
            {
              ...state.displayData[action.sampleID].tasks[action.taskIndex],
              state: action.state,
              progress: action.progress
            },
            ...state.displayData[action.sampleID].tasks.slice(action.taskIndex + 1)
          ]
        }
      };

      const current = { ...state.current, node: action.sampleID };

      return Object.assign({}, state, { displayData, queue, current });
    }
    case 'SET_MANUAL_MOUNT': {
      const data = { manualMount: { ...state.manualMount, set: action.manual } };
      return Object.assign({}, state, data);
    }
    case 'CLEAR_QUEUE': {
      return Object.assign({}, state, { queue: {} });
    }
    // Adding sample to queue
    case 'ADD_SAMPLE': {
      const sampleID = action.sampleData.sampleID;
      const displayData = { ...state.displayData };
      displayData[sampleID] = { collapsed: false, state: 0, tasks: [] };

      // Not creating a copy here since we know that the reference
      // displayData[sampleID] did not exist before
      action.sampleData.tasks.map((task) => {
        displayData[sampleID].tasks.push({ collapsed: false, state: 0 });
        return task;
      });

      return Object.assign({}, state,
        {
          displayData,
          todo: { ...state.todo, nodes: state.todo.nodes.concat(sampleID) },
          queue: { ...state.queue, [sampleID]: action.sampleData },
          manualMount: { ...state.manualMount, id: state.manualMount.id + 1 }
        }
      );
    }
        // Setting state
    case 'SET_QUEUE_STATUS':
      return {
        ...state,
        queueStatus: action.queueState
      };

        // Removing sample from queue
    case 'REMOVE_SAMPLE':
      return Object.assign({}, state,
        { todo: { ...state.todo, nodes: without(state.todo.nodes, action.sampleID) },
          queue: omit(state.queue, action.sampleID),
          displayData: omit(state.displayData, action.sampleID),
        });

        // Adding the new task to the queue
    case 'ADD_TASK': {
      const sampleID = action.task.sampleID;

      const queue = {
        ...state.queue,
        [sampleID]: {
          ...state.queue[sampleID],
          tasks: [...state.queue[sampleID].tasks, action.task]
        }
      };

      const displayData = {
        ...state.displayData,
        [sampleID]: {
          ...state.displayData[sampleID],
          tasks: [...state.displayData[sampleID].tasks, { collapsed: false, state: 0 }]
        }
      };

      return Object.assign({}, state, { displayData, queue });
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

      const displayData = {
        ...state.displayData,
        [action.sampleID]: {
          ...state.displayData[action.sampleID],
          tasks: [...state.displayData[action.sampleID].tasks.slice(0, action.taskIndex),
                  ...state.displayData[action.sampleID].tasks.slice(action.taskIndex + 1)]
        }
      };

      return Object.assign({}, state, { displayData, queue });
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
          todo: { ...state.todo, nodes: without(state.todo.nodes, action.sampleID) },
          history: { ...state.history,
                     nodes: (state.current.node ?
                             state.history.nodes.concat(state.current.node) : state.history.nodes)
          }
        }
      );
    case 'CLEAR_CURRENT_SAMPLE':
      return Object.assign({}, state,
        {
          current: { node: null, collapsed: false, running: false },
          history: {
            ...state.history,
            nodes: (
              state.current.node ?
              state.history.nodes.concat(state.current.node) : state.history.nodes
            )
          }
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
     // Collapse list
    case 'COLLAPSE_LIST':
      return {
        ...state,
        [action.list_name]: { ...state[action.list_name],
        collapsed: !state[action.list_name].collapsed
        }
      };
    // Toggle sample collapse flag
    case 'COLLAPSE_SAMPLE': {
      const displayData = Object.assign({}, state.displayData);
      displayData[action.sampleID].collapsed ^= true;

      return { ...state, displayData };
    }
    // Toggle task collapse flag
    case 'COLLAPSE_TASK': {
      const displayData = Object.assign({}, state.displayData);
      displayData[action.sampleID].tasks[action.taskIndex].collapsed ^= true;

      return { ...state, displayData };
    }
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
      const displayData = Object.assign({}, state.displayData);

      queue[action.sampleId].tasks = update(state.queue[action.sampleId].tasks,
        {
          $splice: [[action.oldIndex, 1],
          [action.newIndex, 0,
          state.queue[action.sampleId].tasks[action.oldIndex]]]
        });
      displayData[action.sampleId].tasks = update(state.displayData[action.sampleId].tasks,
        {
          $splice: [[action.oldIndex, 1],
          [action.newIndex, 0,
          state.displayData[action.sampleId].tasks[action.oldIndex]]]
        });

      return { ...state, queue, displayData };
    }
    case 'redux-form/CHANGE':
      if (action.form === 'search-sample') {
        return Object.assign({}, state, { searchString: action.value });
      }
      return state;
    case 'CLEAR_ALL':
      {
        return Object.assign({}, state, { ...initialState,
                                          manualMount: { set: state.manualMount.set, id: 1 } });
      }
    case 'SHOW_RESTORE_DIALOG':
      {
        return { ...state, showRestoreDialog: action.show, queueRestoreState: action.queueState };
      }
    case 'QUEUE_STATE':
      {
        return Object.assign({}, state, ...action.queueState);
      }
    case 'SET_INITIAL_STATUS':
      {
        return { ...state, rootPath: action.data.rootPath,
                           manualMount: { set: state.manualMount.set, id: 1 } };
      }
    default:
      return state;
  }
};
