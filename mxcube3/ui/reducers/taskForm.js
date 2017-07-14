const initialState = {
  sampleIds: [],
  taskData: {},
  pointID: -1,
  showForm: '',
  path: '',
  fileSuffix: '',
  defaultParameters: {
    datacollection: {},
    characterisation: {},
    helical: {},
    mesh: {},
    interleaved: { subWedgeSize: 10 }
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
                   ...action.tasks[0].parameters
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
            [action.taskData.type.toLowerCase()]: {
              ...action.taskData.parameters
            }
          }
        };
      }
    case 'SET_CURRENT_SAMPLE':
      {
        return {
          ...state,
          defaultParameters: {
            datacollection: { ...state.defaultParameters.datacollection },
            characterisation: { ...state.defaultParameters.characterisation },
            helical: { ...state.defaultParameters.helical },
            mesh: { ...state.defaultParameters.mesh },
            workflow: { ...state.defaultParameters.workflow },
            interleaved: { ...state.defaultParameters.interleaved }
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
              ...action.data.dcParameters,
              ...state.defaultParameters.datacollection },
            characterisation: {
              ...action.data.charParameters,
              ...state.defaultParameters.characterisation },
            helical: {
              ...action.data.dcParameters,
              ...state.defaultParameters.helical },
            mesh: {
              ...action.data.dcParameters,
              ...state.defaultParameters.mesh },
            workflow: {
              ...action.data.dcParameters,
              ...state.defaultParameters.workflow },
            interleaved: {
              ...state.defaultParameters.interleaved }
          },
          acqParametersLimits: { ...action.data.acqParametersLimits },
          fileSuffix: action.data.detector.fileSuffix
        };
      }
    default:
      return state;
  }
};
