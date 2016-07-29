import { omit } from 'lodash/object';
import { without, xor } from 'lodash/array';
import update from 'react/lib/update';

const initialState = {
  queue: [],
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
  queueRestoreState: {}
};

export default (state = initialState, action) => {
  switch (action.type) {
        // Adding sample to queue
    case 'ADD_SAMPLE':
      return Object.assign({}, state,
        {
          todo: { ...state.todo, nodes: state.todo.nodes.concat(action.queueID) },
          queue: { ...state.queue, [action.queueID]: [] },
          lookup: { ...state.lookup, [action.queueID]: action.sampleID },
          lookup_queueID: { ...state.lookup_queueID, [action.sampleID]: action.queueID },
          collapsedSample: { ...state.collapsedSample, [action.queueID]: true }
        }
      );

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
      let tasks = state.queue || [];
      tasks = tasks.concat([{ type: action.taskType,
                              label: action.taskType.split(/(?=[A-Z])/).join(' '),
                              sampleID: action.sampleID,
                              queueID: tasks.length,
                              parentID: action.parentID,
                              parameters: action.parameters,
                              state: 0
      }]);

      return Object.assign({}, state, { queue: tasks, checked: state.checked.concat(0) });
    }
    // Removing the task from the queue
    case 'REMOVE_TASK': {
      const index = state.queue.indexOf(action.task);
      return Object.assign({}, state, { queue: without(state.queue, state.queue[index]),
                                        checked: without(state.checked, action.queueID) });
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
        return Object.assign({}, state, initialState);
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
        return { ...state, rootPath: action.data.rootPath };
      }
    default:
      return state;
  }
};
