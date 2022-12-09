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
    xrfscan: {},
    interleaved: { sub_wedge_size: 10 },
  },
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SHOW_FORM': {
      return {
        ...state,
        showForm: action.name,
        sampleIds: action.sampleIDs,
        taskData: { ...action.taskData },
        pointID: action.pointID,
      };
    }
    case 'ADD_TASKS': {
      let type = action.tasks[0].type.toLowerCase();
      if (action.tasks[0].parameters.helical) {
        type = 'helical';
      }
      return {
        ...state,
        defaultParameters: {
          ...state.defaultParameters,
          [type]: {
            ...action.tasks[0].parameters,
          },
        },
      };
    }
    case 'ADD_TASK': {
      let type = action.tasks[0].type.toLowerCase();
      if (action.tasks[0].parameters.helical) {
        type = 'helical';
      }
      return {
        ...state,
        defaultParameters: {
          ...state.defaultParameters,
          [type]: {
            ...action.tasks[0].parameters,
          },
        },
      };
    }
    case 'UPDATE_TASK': {
      return {
        ...state,
        defaultParameters: {
          ...state.defaultParameters,
          [action.taskData.type.toLowerCase()]: {
            ...action.taskData.parameters,
          },
        },
      };
    }
    case 'RESET_TASK_PARAMETERS': {
      return {
        ...state,
        defaultParameters: {
          ...state.initialParameters,
        },
      };
    }
    case 'UPDATE_DEFAULT_PARAMETERS': {
      let type = action.data.type.toLowerCase();
      if (action.data.helical) {
        type = 'helical';
      } else if (action.data.mesh) {
        type = 'mesh';
      }
      return {
        ...state,
        defaultParameters: {
          ...state.defaultParameters,
          [type]: {
            ...state.defaultParameters[type],
            "acq_parameters": { ...action.data },
          },
        },
      };
    }
    case 'HIDE_FORM': {
      return { ...state, showForm: '' };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        defaultParameters: {
          ...action.data.taskParameters
        },
        initialParameters: {
          ...action.data.taskParameters
        },
        fileSuffix: action.data.detector.fileSuffix,
      };
    }
    default:
      return state;
  }
};
