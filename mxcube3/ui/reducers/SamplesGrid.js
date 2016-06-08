import { omit } from 'lodash/object';


const initialState = { samples_list: {},
                       filter_text: '',
                       selected: {},
                       sampleOrder: new Map(),
                       clicked_task: Object(),
                       manualMount: { set: false, id: 0 },
                       login_data: {},
                       moving: {}};


function initialSampleOrder(sampleList) {
  let sampleOrder = new Map();
  
  for (const key in sampleList) {
    sampleOrder.set(key, sampleOrder.size);
  }

  return sampleOrder;
}

export default (state = initialState, action) => {
  switch (action.type) {
    case "SIGNOUT":
      return Object.assign({}, initialState);
    case 'UPDATE_SAMPLES':
      return Object.assign({}, state, { samples_list: action.samples_list,
                                        sampleOrder: initialSampleOrder(action.samples_list) });
    case 'ADD_SAMPLE_TO_GRID':
    return { ...state, samples_list: { ...state.samples_list, [action.id]: action.data },
             manualMount: { ...state.manualMount, id: state.manualMount.id + 1 } };
    case 'REORDER_SAMPLE': {
      return Object.assign({}, state, {sampleOrder: action.sampleOrder});
    }
    case 'TOGGLE_MOVEABLE_SAMPLE': {
      const movingItems = {};
      movingItems[action.key] = (!state.moving[action.key] && state.selected[action.key]);
      return Object.assign({}, state, {moving: movingItems}); 
    }
    case 'TOGGLE_SELECTED':
      {
        const selectedItems = {};
        const movingItems = {};
        movingItems[action.key] = (state.moving[action.key] && state.selected[action.key]);
        selectedItems[action.index] = !state.selected[action.index];
        return Object.assign({}, state, { selected: selectedItems, moving: movingItems});
      }
    case 'CLICKED_TASK':
      {
        return Object.assign({}, state, { clicked_task: action.task });
      }
    case 'SELECT_ALL':
      {
        // Creating a new SampleList with the "selected" state toggled to "true"
        const newSelected = {};
        Object.keys(state.samples_list).forEach((key) => {
          newSelected[key] = action.selected;
        });

        return Object.assign({}, state, { selected: newSelected });
      }
    case 'UNSELECT_ALL':
      {
        return Object.assign({}, state, { selected: {} });
      }
    case 'FILTER':
      {
        return Object.assign({}, state, { filter_text: action.filter_text });
      }
    case 'SET_SAMPLES_INFO':
      {
        const samplesList = {};

        Object.keys(state.samplesList).forEach(key => {
          const sample = state.samplesList[key];
          let sampleInfo;
          for (sampleInfo of action.sample_info_list) {
            if (sampleInfo.code) {
              // find sample with data matrix code
              if (sample.code === sampleInfo.code) {
                samplesList[key] = Object.assign({}, sample, { sample_info: sampleInfo });
                break;
              }
            } else {
              // check with sample changer location
              const limsLocation = `${sampleInfo.containerSampleChangerLocation} : ${sampleInfo.sampleLocation}`;

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
        return Object.assign({}, state, { samples_list: samplesList });
      }
    case 'SET_MANUAL_MOUNT':
      {
        const data = { manualMount: { ...state.manualMount, set: action.manual } };
        return Object.assign({}, state, data);
      }
    case 'ADD_METHOD':
      {
        return Object.assign({}, state,
             { samples_list: { ...state.samples_list,
              [action.index]: { ...state.samples_list[action.index],
                tasks: { ...state.samples_list[action.index].tasks, [action.queue_id]:
                {
                  type: action.task_type,
                  label: action.task_type.split(/(?=[A-Z])/).join(' '),
                  sample_id: action.index,
                  queue_id: action.queue_id,
                  parent_id: action.parent_id,
                  parameters: action.parameters,
                  state: 0
                }
                }
              }
             } });
      }
    case 'CHANGE_METHOD':
      {
        return Object.assign({}, state,
             { samples_list: { ...state.samples_list,
              [action.index]: { ...state.samples_list[action.index],
                tasks: { ...state.samples_list[action.index].tasks, [action.queue_id]:
                {
                  ...state.samples_list[action.index].tasks[action.queue_id],
                  type: action.parameters.Type,
                  queue_id: action.queue_id,
                  parameters: action.parameters
                } }
              }
             } }
          );
      }
    case 'REMOVE_METHOD':
      {
        return Object.assign({}, state,
             { samples_list: { ...state.samples_list,
              [action.index]: { ...state.samples_list[action.index],
                tasks: omit(state.samples_list[action.index].tasks, [action.queue_id])
              }
             } }
          );
      }
    case 'REMOVE_SAMPLE':
      {
        return Object.assign({}, state,
             { samples_list: { ...state.samples_list,
              [action.index]: { ...state.samples_list[action.index],
                tasks: {}
              }
             } }
          );
      }
    case 'ADD_METHOD_RESULTS':
      {
        return Object.assign({}, state,
             { samples_list: { ...state.samples_list,
              [action.index]: { ...state.samples_list[action.index],
                tasks: { ...state.samples_list[action.index].tasks, [action.queue_id]:
                {
                  ...state.samples_list[action.index].tasks[action.queue_id],
                  state: action.state
                } }
              }
             } }
          );
      }
    case 'QUEUE_STATE':
      return state; // action.sampleGridState;
    case 'SET_INITIAL_STATUS':
      {
        return { ...state, manualMount: { set: !action.data.useSC, id: 0 } };
      }
    default:
      return state;
  }
};
