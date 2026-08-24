const INITIAL_STATE = {
  sampleIds: [],
  taskData: {},
  pointID: -1,
  showForm: '',
  path: '',
  fileSuffix: '',
  doseEstimate: null,
  defaultParameters: {
    datacollection: {},
    characterisation: {},
    helical: {},
    mesh: {},
    xrf_spectrum: {},
    energy_scan: {},
    interleaved: { sub_wedge_size: 10 },
  },
};

function taskFormReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SHOW_FORM': {
      return {
        ...state,
        showForm: action.name,
        sampleIds: action.sampleIDs,
        taskData: { ...action.taskData },
        pointID: action.pointID,
        origin: action.origin,
      };
    }
    case 'HIDE_FORM': {
      return { ...state, showForm: '', doseEstimate: null };
    }
    case 'SET_DOSE_ESTIMATE': {
      return { ...state, doseEstimate: action.data };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        defaultParameters: {
          ...action.data.taskParameters,
        },
        fileSuffix: action.data.detector.fileSuffix,
      };
    }
    default: {
      return state;
    }
  }
}

export default taskFormReducer;
