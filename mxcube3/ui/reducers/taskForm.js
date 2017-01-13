const initialState = {
  sampleIds: [],
  taskData: {},
  pointID: -1,
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
          pointID: action.pointID
        };
      }
    case 'ADD_TASKS':
      {
        let type = action.tasks[0].type.toLowerCase();
        if (action.tasks[0].parameters.helical) {
          type = 'helical';
        }
        return { ...state, defaultParameters:
                 { ...state.defaultParameters, [type]: {
                   ...action.tasks[0].parameters, run_number:
                   state.defaultParameters[type].run_number + 1
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
            [action.taskData.parameters.type.toLowerCase()]: {
              ...action.taskData.parameters, run_number:
             state.defaultParameters[action.taskData.parameters.type.toLowerCase()].run_number
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
    case 'SET_INITIAL_STATE':
      {
        return {
          ...state,
          defaultParameters: {
            datacollection: {
              run_number: 1,
              ...action.data.dcParameters,
              ...state.defaultParameters.datacollection },
            characterisation: {
              run_number: 1,
              ...action.data.dcParameters,
              ...state.defaultParameters.characterisation },
            helical: {
              run_number: 1,
              ...action.data.dcParameters,
              ...state.defaultParameters.helical }
          },
          acqParametersLimits: { ...action.data.acqParametersLimits }
        };
      }
    default:
      return state;
  }
};

