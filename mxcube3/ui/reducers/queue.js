import { omit, invert } from 'lodash/object';
import { without } from 'lodash/array';
import update from 'react/lib/update';

const initialState = {
  queue: {},
  current: { node: null, running: false },
  sampleOrder: [],
  todo: [],
  history: [],
  searchString: '',
  queueStatus: 'QueueStopped',
  showResumeQueueDialog: false,
  sampleList: {},
  manualMount: { set: false, id: 1 },
  visibleList: 'current'
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_QUEUE': {
      return Object.assign({}, state, { queue: action.queue });
    }
    case 'SET_SAMPLE_LIST': {
      return Object.assign({}, state, { sampleList: action.sampleList });
    }
    case 'APPEND_TO_SAMPLE_LIST': {
      const sampleList = { ...state.sampleList, [action.sampleData.sampleID]: action.sampleData };
      const manualMount = { ...state.manualMount };
      if (state.manualMount.set) {
          manualMount.id = state.manualMount.id + 1;
      }
      return Object.assign({}, state, { sampleList, manualMount });
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

      const current = { ...state.current, node: action.sampleID };

      return Object.assign({}, state, { queue, current });
    }
    case 'SET_MANUAL_MOUNT': {
      const data = { manualMount: { ...state.manualMount, set: action.manual } };
      return Object.assign({}, state, data);
    }
    case 'CLEAR_QUEUE': {
      return Object.assign({}, state, { queue: {} });
    }

    // Adding sample to queue
    case 'ADD_SAMPLES': {
      const samplesID = action.samplesData.map((sample) => sample.sampleID);
      const samplesData = {};
      action.samplesData.forEach((sample) => {
        samplesData[sample.sampleID] = { ...sample, state: 0 };
      });

      return Object.assign({}, state,
        {
          todo: [...state.todo, ...samplesID],
          queue: { ...state.queue, ...samplesData },
          sampleOrder: [...state.sampleOrder, ...samplesID]
        }
      );
    }

    // Adding sample to queue
    case 'ADD_SAMPLE': {
      const sampleID = action.sampleData.sampleID;

      for (const task of action.sampleData.tasks) {
        task.state = 0;

        if (task.parameters.prefix === '') {
          task.parameters.prefix = state.sampleList[sampleID].defaultPrefix;
        }
      }

      return Object.assign({}, state,
        {
          todo: [...state.todo, sampleID],
          queue: { ...state.queue, [sampleID]: { ...action.sampleData, state: 0 } },
          sampleOrder: [...state.sampleOrder, sampleID],
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
        { todo: without(state.todo, action.sampleID),
          queue: omit(state.queue, action.sampleID),
          sampleOrder: without(state.sampleOrder, action.sampleID),
        });

        // Adding the new task to the queue
    case 'ADD_TASKS': {
      const queue = { ...state.queue };

      action.tasks.forEach((task) => {
        if (task.parameters.prefix === '') {
          task.parameters.prefix = state.sampleList[task.sampleID].defaultPrefix;
        }
        queue[task.sampleID] = {
          ...queue[task.sampleID],
          tasks: [...queue[task.sampleID].tasks, { ...task, state: 0 }]
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
      const sampleOrder = without(state.order, action.sampleID);

      return Object.assign({}, state, { queue, sampleOrder });
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
          todo: without(state.todo, action.sampleID),
          history: [...state.history, state.current.node]
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
        return Object.assign({}, state, { ...initialState,
                                          manualMount: { set: state.manualMount.set, id: 1 } });
      }
    case 'SHOW_RESUME_QUEUE_DIALOG':
      {
        return { ...state, showResumeQueueDialog: action.show };
      }
    case 'QUEUE_STATE':
      {
        return Object.assign({}, state, ...action.queueState);
      }
    case 'SET_INITIAL_STATUS':
      {
        return {
          ...state,
          sampleList: action.data.queue.sample_list,
          rootPath: action.data.rootPath,
          manualMount: {
            set: !action.data.useSC,
            id: action.data.queue.todo.length + action.data.queue.history.length + 1
          },
          queue: action.data.queue.queue,
          todo: without(action.data.queue.todo, action.data.queue.loaded),
          history: without(action.data.queue.history, action.data.queue.loaded),
          sampleOrder: action.data.queue.sample_order,
          current: { node: action.data.queue.loaded, running: false }
        };
      }
    default:
      return state;
  }
};
