import { omit } from 'lodash/object';
import { without, xor } from 'lodash/array';
import update from 'react/lib/update';


/**
*  Initial redux state for queue,
*
*  sampleList:  Object consisting of sample objects, each sample object have
*               the following peroperties:
*
*               code        Data Matrix/Barcode of sample
*               id          Unique id for the sample
*               location    Location of sample in sample changer
*               queueOrder  Order of sample in queue
*
*  manulMount: Sample with id is manually mounted if set is true
*
*/

const initialState = {
  queue: {},
  current: { node: null, collapsed: false, running: false },
  todo: { nodes: [], collapsed: false },
  history: { nodes: [], collapsed: false },
  checked: [],
  lookup: {},
  lookup_queueID: {},
  collapsedSample: {},
  searchString: '',
  queueStatus: 'QueueStopped',
  showRestoreDialog: false,
  queueRestoreState: {},
  sampleList: {},
  manualMount: { set: false, id: 0 }
};


/**
 * Initalizes the list of samples
 *
 * @param {Object} samples - sampleList object (key, sample data) pairs
 * @returns {Object} - initialized sampleList object
 *
 */
function initSampleList(samples) {
  const sampleList = Object.assign({}, samples);

  for (const key in sampleList) {
    if (key) {
      sampleList[key].queueOrder = -1;
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
  const sampleList = Object.assign({}, state.sampleList);
  const sortedOrder = Object.entries(gridOrder).sort((a, b) => a[1] > b[1]);

  let i = 0;
  for (const [key] of sortedOrder) {
    if (keys.includes(key)) {
      sampleList[key].queueOrder = i;
      i++;
    }
  }

  return sampleList;
}


export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SAMPLE_LIST': {
      return Object.assign({}, state, { sampleList: initSampleList(action.sampleList) });
    }
    case 'SET_SAMPLE_ORDER': {
      const reorderKeys = Object.keys(action.keys).map(key => (action.keys[key] ? key : ''));
      const sampleList = recalculateQueueOrder(reorderKeys, action.order, state);

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
      const queueID = state.lookup_queueID[action.sampleID];
      const tasks = Array.from(state.queue[queueID]);

      // Find element with the right queueID (action.queueID) and update state
      // to action.state
      for (const task of tasks) {
        if (task.queueID === action.taskQueueID) {
          task.state = action.state;
        }
      }

      return Object.assign({}, state, { queue: { ...state.queue, [queueID]: tasks } });
    }
    case 'SET_MANUAL_MOUNT': {
      const data = { manualMount: { ...state.manualMount, set: action.manual } };
      return Object.assign({}, state, data);
    }

    // Adding sample to queue
    case 'ADD_SAMPLE': {
      const sampleList = { ...state.sampleList, [action.sampleID]: action.sampleData || {} };

      return Object.assign({}, state,
        {
          todo: { ...state.todo, nodes: state.todo.nodes.concat(action.queueID) },
          queue: { ...state.queue, [action.queueID]: [] },
          lookup: { ...state.lookup, [action.queueID]: action.sampleID },
          lookup_queueID: { ...state.lookup_queueID, [action.sampleID]: action.queueID },
          collapsedSample: { ...state.collapsedSample, [action.queueID]: true },
          manualMount: { ...state.manualMount, id: state.manualMount.id + 1 },
          sampleList
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
        { todo: { ...state.todo, nodes: without(state.todo.nodes, action.queueID) },
          queue: omit(state.queue, action.queueID),
          lookup: omit(state.lookup, action.queueID),
          collapsedSample: omit(state.collapsedSample, action.queueID),
          lookup_queueID: omit(state.lookup_queueID, action.index)
        });

        // Adding the new task to the queue
    case 'ADD_TASK': {
      const queueID = state.lookup_queueID[action.sampleID];

      // Create a copy of the tasks (array) for a sample with given queueID,
      // or an empty array if no tasks exists for sampleID
      let tasks = Array.from(state.queue[queueID] || []);
      tasks = tasks.concat([{ type: action.taskType,
                              label: action.taskType.split(/(?=[A-Z])/).join(' '),
                              sampleID: action.sampleID,
                              queueID: action.queueID,
                              parentID: action.parentID,
                              parameters: action.parameters,
                              state: 0
      }]);

      const queue = { ...state.queue, [queueID]: tasks };
      return Object.assign({}, state, { queue, checked: state.checked.concat(0) });
    }
    // Removing the task from the queue
    case 'REMOVE_TASK': {
      const queueID = state.lookup_queueID[action.task.sampleID];
      const tasks = without(state.queue[queueID], action.task);

      return Object.assign({}, state, { queue: { ...state.queue, [queueID]: tasks },
                                        checked: without(state.checked, action.queueID) });
    }
    case 'UPDATE_TASK': {
      const queueID = state.lookup_queueID[action.sampleID];
      const taskIndex = state.queue[queueID].indexOf(action.taskData);
      const tasks = Array.from(state.queue[queueID]);

      tasks[taskIndex] = { ...action.taskData,
                           type: action.parameters.Type,
                           parameters: action.parameters };

      return Object.assign({}, state, { queue: { ...state.queue, [queueID]: tasks } });
    }
    // Run Mount, this will add the mounted sample to history
    case 'MOUNT_SAMPLE':
      return Object.assign({}, state,
        {
          current: { ...state.current, node: action.queueID, running: false },
          todo: { ...state.todo, nodes: without(state.todo.nodes, action.queueID) },
          history: {
            ...state.history,
            nodes: (
              state.current.node ?
              state.history.nodes.concat(state.current.node) : state.history.nodes
            )
          }
        }
      );
        //  UNMount, this will remove the sample from current and add it to history
    case 'UNMOUNT_SAMPLE':
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
      return Object.assign({}, state,
        {
          current: { ...state.current, running: true }
        }
                        );

    case 'TOGGLE_CHECKED':
      return Object.assign({}, state,
        {
          checked: xor(state.checked, [action.queueID])
        }
                        );

        // Collapse list
    case 'COLLAPSE_LIST':
      return {
        ...state,
        [action.list_name]: { ...state[action.list_name],
        collapsed: !state[action.list_name].collapsed
        }
      };
    // Collapse list
    case 'COLLAPSE_SAMPLE':
      return {
        ...state,
        collapsedSample: {
          ...state.collapsedSample,
          [action.queueID]: !state.collapsedSample[action.queueID]
        }
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
    case 'CHANGE_METHOD_ORDER':

      return {
        ...state,
        queue: { ...state.queue,
                [action.sampleId]: update(state.queue[action.sampleId], {
                  $splice: [
                    [action.oldIndex, 1],
                    [action.newIndex, 0, state.queue[action.sampleId][action.oldIndex]]
                  ]
                })
              }
      };

    case 'redux-form/CHANGE':
      if (action.form === 'search-sample') {
        return Object.assign({}, state, { searchString: action.value });
      }
      return state;
    case 'CLEAR_ALL':
      {
        return Object.assign({}, state, { ...initialState,
                                          manualMount: { set: state.manualMount.set, id: 0 } });
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
                           manualMount: { set: state.manualMount.set, id: 0 } };
      }
    default:
      return state;
  }
};
