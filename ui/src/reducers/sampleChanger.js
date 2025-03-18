const INITIAL_STATE = { contents: {}, state: 'READY',status:'READY', sampleLN2Level:'UNKNOWN',loadedSample: {} };

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'SET_SC_CONTENTS': {
      return { ...state, contents: action.data.sampleChangerContents };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        state: action.data.sampleChangerState.state,
        status: action.data.sampleChangerStatus.status,
        plateMode: action.data.plateMode,
        sampleLN2Level :action.data.sampleLN2Level,
        contents: action.data.sampleChangerContents,
        loadedSample: action.data.loadedSample,
      };
    }
    case 'SET_LOADED_SAMPLE': {
      return {
        ...state,
        loadedSample: action.data,
      };
    }
    case 'SET_SC_STATE': {
      return { ...state, state: action.state };
    }

    case 'SET_SC_STATUS': {
      return { ...state, status: action.status };
    }
    case 'SET_SC_SampleLN2Level':{
      console.log('data in reducer of SET_SC_SampleLN2Level')
      console.log(action.data)
      return {...state,sampleLN2Level:action.data}
    }
    case 'SET_PLATE_MODE':{
      return { ...state, plateMode:action.plateMode };
    }
    case 'SET_SC_GLOBAL_STATE': {
      return {
        ...state,
        state: JSON.parse(action.data.state).state,
      };
    }
    default: {
      return state;
    }
  }
};
