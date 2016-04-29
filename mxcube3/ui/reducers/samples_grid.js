import { omit } from 'lodash/object';

export default (state = { samples_list: {}, filter_text: '', selected: {}, clicked_task: Object(), manualMount: { set: false, id: 0 }, login_data: {} }, action) => {
  switch (action.type) {
    case 'UPDATE_SAMPLES':
          // should have session samples
      return Object.assign({}, state, { samples_list: action.samples_list });
    case 'ADD_SAMPLE_TO_GRID':
          // should have session samples
      return { ...state, samples_list: { ...state.samples_list, [action.id] : action.data }, manualMount : { ...state.manualMount, id : state.manualMount.id + 1 } };
    case 'TOGGLE_SELECTED':
      {
          let new_selected = Object.assign({}, state.selected);
          new_selected[action.index] = !state.selected[action.index];
          return Object.assign({}, state, { selected: new_selected });
        }
    case 'CLICKED_TASK':
      {
          return Object.assign({}, state, { clicked_task: action.task });
        }
    case 'SELECT_ALL':
      {
          // Creating a new SampleList with the "selected" state toggled to "true"
          let new_selected = {};
          Object.keys(state.samples_list).forEach(function (key) {
          new_selected[key] = action.selected;
        });

          return Object.assign({}, state, { selected: new_selected });
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
          let samples_list = {};
          Object.keys(state.samples_list).forEach(key => {
          let sample = state.samples_list[key];
          let sample_info;
          for (sample_info of action.sample_info_list) {
              if (sample_info.code) {
                      // find sample with data matrix code
                  if (sample.code == sample_info.code) {
                      samples_list[key] = Object.assign({}, sample, { sample_info: sample_info });
                      break;
                    }
                } else {
                      // check with sample changer location
                  let lims_location = sample_info.containerSampleChangerLocation + ':' + sample_info.sampleLocation;
                  if (sample.location == lims_location) {
                      samples_list[key] = Object.assign({}, sample, { sample_info: sample_info });
                      break;
                    }
                }
            }
          if (samples_list[key] === undefined) {
              samples_list[key] = Object.assign({}, sample, { sample_info: null });
            }
        });
          return Object.assign({}, state, { samples_list: samples_list });
        }
    case 'SET_MANUAL_MOUNT':
      {
          return Object.assign({}, state, { manualMount: { ...state.manualMount, set : action.manual } });
        }
    case 'ADD_METHOD':
      {
          return Object.assign({}, state,
             { samples_list : { ...state.samples_list,
              [action.index] : { ...state.samples_list[action.index],
                tasks : { ...state.samples_list[action.index].tasks, [action.queue_id] :
                {
                  type: action.task_type,
                  label: action.task_type.split(/(?=[A-Z])/).join(' '),
                  sample_id: action.index,
                  queue_id: action.queue_id,
                  parent_id: action.parent_id,
                  parameters : action.parameters,
                  state: 0
                }
                }
              }
             } });
        }
    case 'CHANGE_METHOD':
      {
          return Object.assign({}, state,
             { samples_list : { ...state.samples_list,
              [action.index] : { ...state.samples_list[action.index],
                tasks : { ...state.samples_list[action.index].tasks, [action.queue_id] :
                {
                  ...state.samples_list[action.index].tasks[action.queue_id],
                  type: action.parameters.Type,
                  queue_id: action.queue_id,
                  parameters : action.parameters
                } }
              }
             } }
          );
        }
    case 'REMOVE_METHOD':
      {
          return Object.assign({}, state,
             { samples_list : { ...state.samples_list,
              [action.index] : { ...state.samples_list[action.index],
                tasks : omit(state.samples_list[action.index].tasks, [action.queue_id])
              }
             } }
          );
        }
    case 'REMOVE_SAMPLE':
      {
          return Object.assign({}, state,
             { samples_list : { ...state.samples_list,
              [action.index] : { ...state.samples_list[action.index],
                tasks : {}
              }
             } }
          );
        }
    case 'ADD_METHOD_RESULTS':
      {
          return Object.assign({}, state,
             { samples_list : { ...state.samples_list,
              [action.index] : { ...state.samples_list[action.index],
                tasks : { ...state.samples_list[action.index].tasks, [action.queue_id] :
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
          return { ...state, manualMount : { set: !action.data.useSC, id: 0 } };
        }
    default:
      return state;
  }
};
