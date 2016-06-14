import { omit } from 'lodash/object';


const initialState = { sampleList: {},
                       selected: {},
                       order: new Map(),
                       picked: {},
                       moving: {},
                       manualMount: { set: false, id: 0 },
                       filterText: '' };


function initialSampleOrder(sampleList) {
  const order = new Map();

  for (const key in sampleList) {
    if (key) {
      order.set(key, order.size);
    }
  }

  return order;
}

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SIGNOUT': {
      return Object.assign({}, initialState);
    }
    case 'UPDATE_SAMPLE_LIST': {
      return Object.assign({}, state, { sampleList: action.sampleList,
                                        order: initialSampleOrder(action.sampleList) });
    }
    case 'ADD_SAMPLE_TO_GRID': {
      return { ...state, sampleList: { ...state.sampleList, [action.id]: action.data },
               manualMount: { ...state.manualMount, id: state.manualMount.id + 1 } };
    }
    case 'SET_SAMPLE_ORDER': {
      return Object.assign({}, state, { order: action.order });
    }
    case 'TOGGLE_MOVABLE_SAMPLE': {
      const movingItems = {};
      movingItems[action.key] = (!state.moving[action.key] && state.selected[action.key]);
      return Object.assign({}, state, { moving: movingItems });
    }
    case 'TOGGLE_SELECTED': {
      const selectedItems = {};
      const movingItems = {};
      movingItems[action.key] = (state.moving[action.key] && state.selected[action.key]);
      selectedItems[action.id] = !state.selected[action.id];
      return Object.assign({}, state, { selected: selectedItems, moving: movingItems });
    }
    case 'SELECT_SAMPLES': {
      const selectedItems = {};

      for (const key of action.indices) {
        selectedItems[key] = true;
      }

      return Object.assign({}, state, { selected: selectedItems });
    }
    case 'PICK_SELECTED_SAMPLES': {
      const picked = Object.assign({}, state.picked);

      for (const key in state.selected) {
        if (state.selected[key]) {
          picked[key] = !picked[key];
        }
      }

      return Object.assign({}, state, { picked });
    }
    case 'PICK_ALL_SAMPLES': {
      // Creating a new sampleList with the "selected" state toggled to "true"
      const picked = {};
      Object.keys(state.sampleList).forEach((key) => {
        picked[key] = action.picked;
      });

      return Object.assign({}, state, { picked });
    }
    case 'UNFLAG_ALL_TO_BE_COLLECTED': {
      return Object.assign({}, state, { picked: {} });
    }
    case 'FILTER_SAMPLE_LIST': {
      return Object.assign({}, state, { filterText: action.filterText });
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
    case 'SET_MANUAL_MOUNT': {
      const data = { manualMount: { ...state.manualMount, set: action.manual } };
      return Object.assign({}, state, data);
    }
    case 'ADD_TASK': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: { ...state.sampleList[action.index].tasks, [action.queueID]:
                {
                  type: action.taskType,
                  label: action.taskType.split(/(?=[A-Z])/).join(' '),
                  sampleID: action.index,
                  queueID: action.queueID,
                  parentID: action.parentID,
                  parameters: action.parameters,
                  state: 0
                }
                }
              }
             } });
    }
    case 'UPDATE_TASK': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: { ...state.sampleList[action.index].tasks, [action.queueID]:
                {
                  ...state.sampleList[action.index].tasks[action.queueID],
                  type: action.parameters.Type,
                  queueID: action.queueID,
                  parameters: action.parameters
                } }
              }
             } }
          );
    }
    case 'REMOVE_TASK': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: omit(state.sampleList[action.index].tasks, [action.queueID])
              }
             } }
          );
    }
    case 'REMOVE_SAMPLE': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.sampleID]: { ...state.sampleList[action.sampleID],
                tasks: {}
              }
             } }
          );
    }
    case 'ADD_TASK_RESULT': {
      return Object.assign({}, state,
             { sampleList: { ...state.sampleList,
              [action.index]: { ...state.sampleList[action.index],
                tasks: { ...state.sampleList[action.index].tasks, [action.queueID]:
                {
                  ...state.sampleList[action.index].tasks[action.queueID],
                  state: action.state
                } }
              }
             } }
          );
    }
    case 'QUEUE_STATE': {
      return state; // action.sampleGridState;
    }
    case 'SET_INITIAL_STATUS': {
      return { ...state, manualMount: { set: !action.data.useSC, id: 0 } };
    }
    default: {
      return state;
    }
  }
};
