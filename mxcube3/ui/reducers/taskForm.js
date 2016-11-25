const initialState = {
  sampleIds: [],
  taskData: {},
  pointId: -1,
  showForm: '',
  path: '',
  defaultParameters: {
    datacollection: {},
    characterisation: {},
    helical: {}
  }
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SHOW_FORM':
      {
        return {
          ...state,
          showForm: action.name,
          sampleIds: action.sampleIDs,
          taskData: action.taskData,
          pointId: action.point_id
        };
      }
    case 'ADD_TASK':
      {
        return { ...state, defaultParameters:
                 { ...state.defaultParameters, [action.task.type.toLowerCase()]: {
                   ...action.task.parameters, run_number:
                   state.defaultParameters[action.task.type.toLowerCase()].run_number + 1
                 }
               }
             };
      }
    case 'UPDATE_TASK':
      {
        return {
          ...state,
          defaultParameters: {
            ...state.defaultParameters,
            [action.params.type.toLowerCase()]: {
              ...action.params, run_number:
             state.defaultParameters[action.params.type.toLowerCase()].run_number
            }
          }
        };
      }
    case 'MOUNT_SAMPLE':
      {
        return {
          ...state,
          defaultParameters: {
            datacollection: { ...state.defaultParameters.datacollection, run_number: 1 },
            characterisation: { ...state.defaultParameters.characterisation, run_number: 1 },
            helical: { ...state.defaultParameters.helical, run_number: 1 }
          }
        };
      }
    case 'HIDE_FORM':
      {
        return { ...state, showForm: '' };
      }
    case 'SET_INITIAL_STATUS':
      {
        return {
          ...state,
          defaultParameters: {
            datacollection: { ...action.data.dcParameters,
                              ...state.defaultParameters.datacollection, run_number: 1 },
            characterisation: { ...action.data.dcParameters,
              ...state.defaultParameters.characterisation, run_number: 1 },
            helical: {
              ...action.data.dcParameters,
              ...state.defaultParameters.helical,
              run_number: 1
            }
          }
        };
      }
    default:
      return state;
  }
};

