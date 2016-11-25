import { omit, invert } from 'lodash/object';
import { without } from 'lodash/array';
import update from 'react/lib/update';

const initialState = {
  queue: {},
  current: { node: null, running: false },
  sampleOrder: [],
  todo: { nodes: [] },
  history: { nodes: [] },
  searchString: '',
  queueStatus: 'QueueStopped',
  showRestoreDialog: false,
  queueRestoreState: {},
  sampleList: {},
  manualMount: { set: false, id: 1 },
  displayData: {},
  runNow: { runNow: false, sampleId: undefined, taskIndex: undefined },
  visibleList: 'current'
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_QUEUE': {
      return Object.assign({}, state, { queue: action.queue });
    }
    case 'SET_SAMPLE_LIST': {
      return Object.assign({}, state, { sampleList: action.sampleList, sampleOrder: [] });
    }
    case 'APPEND_TO_SAMPLE_LIST': {
      const sampleList = { ...state.sampleList, [action.sampleData.sampleID]: action.sampleData };
      return Object.assign({}, state, { sampleList });
    }
    case 'SET_SAMPLE_ORDER': {
      const sortedOrder = invert(action.order);
      const sampleOrder = [];

      Object.values(sortedOrder).forEach((key) => {
        if (Reflect.has(state.queue, key)) {
          sampleOrder.push(key);
        }
      });

      return Object.assign({}, state, { sampleOrder });
    }
    case 'SET_SAMPLES_INFO': {
      const sampleList = {};
      Object.keys(state.sampleList).forEach(key => {
        const sample = state.sampleList[key];
        let sampleInfo;
        for (sampleInfo of action.sampleInfoList) {
          if (sampleInfo.code) {
            // find sample with data matrix code
            if (sample.code === sampleInfo.code) {
              sampleList[key] = Object.assign({}, sample, { ...sampleInfo });
              break;
            }
          } else {
            // check with sample changer location
            const containerLocation = sampleInfo.containerSampleChangerLocation;
            const sampleLocation = sampleInfo.sampleLocation;
            const limsLocation = `${containerLocation}:${sampleLocation}`;

            if (sample.location === limsLocation) {
              sampleList[key] = Object.assign({}, sample, { ...sampleInfo });
              break;
            }
          }
        }
        if (sampleList[key] === undefined) {
          sampleList[key] = Object.assign({}, sample, { });
        }
      });
      return Object.assign({}, state, { sampleList });
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

      const displayData = {
        ...state.displayData,
        [action.sampleID]: {
          ...state.displayData[action.sampleID],
          tasks: [
            ...state.displayData[action.sampleID].tasks.slice(0, action.taskIndex),
            {
              ...state.displayData[action.sampleID].tasks[action.taskIndex],
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
      const displayData = { ...state.displayData, [sampleID]: { collapsed: false, tasks: [] } };

      // Not creating a copy here since we know that the reference
      // displayData[sampleID] did not exist before
      for (const task of action.sampleData.tasks) {
        displayData[sampleID].tasks.push({ collapsed: false });
        task.state = 0;

        if (task.parameters.prefix === '') {
          task.parameters.prefix = state.sampleList[sampleID].defaultPrefix;
        }
      }

      return Object.assign({}, state,
        {
          displayData,
          todo: { ...state.todo, nodes: state.todo.nodes.concat(sampleID) },
          queue: { ...state.queue, [sampleID]: { ...action.sampleData, state: 0 } },
          sampleOrder: [...state.sampleOrder, sampleID],
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
          sampleOrder: without(state.sampleOrder, action.sampleID),
          displayData: omit(state.displayData, action.sampleID),
        });

        // Adding the new task to the queue
    case 'ADD_TASK': {
      const sampleID = action.task.sampleID;
      const task = action.task;

      if (task.parameters.prefix === '') {
        task.parameters.prefix = state.sampleList[sampleID].defaultPrefix;
      }

      const queue = {
        ...state.queue,
        [sampleID]: {
          ...state.queue[sampleID],
          tasks: [...state.queue[sampleID].tasks, { ...task, state: 0 }]
        }
      };

      const displayData = {
        ...state.displayData,
        [sampleID]: {
          ...state.displayData[sampleID],
          tasks: [...state.displayData[sampleID].tasks, { collapsed: false }]
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

      const sampleOrder = without(state.order, action.sampleID);

      return Object.assign({}, state, { displayData, queue, sampleOrder });
    }
    case 'UPDATE_TASK': {
      const queue = {
        ...state.queue,
        [action.sampleID]: {
          ...state.queue[action.sampleID],
          tasks:
          [
            ...state.queue[action.sampleID].tasks.slice(0, action.taskIndex),
            { ...state.queue[action.sampleID].tasks[action.taskIndex], parameters: action.params },
            ...state.queue[action.sampleID].tasks.slice(action.taskIndex + 1)
          ]
        }
      };

      return Object.assign({}, state, { queue });
    }
    case 'SET_CURRENT_SAMPLE':
      if (state.current.node === action.sampleID) {
        return Object.assign({}, state);
      }

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
     // show list
    case 'SHOW_LIST':
      return {
        ...state,
        visibleList: action.list_name
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
    case 'SET_RUN_NOW':
      {
        return { ...state, runNow: { run: action.run,
                                     sampleID: action.sampleID,
                                     taskIndex: action.taskIndex } };
      }
    default:
      return state;
  }
};
