const INITIAL_STATE = {
  showErrorPanel: false,
  errorMessage: '',
  dialogData: '',
  dialogTitle: '',
  dialogType: '',
  showDialog: false,
  showConnectionLostDialog: false,
  showConfirmClearQueueDialog: false,
  mode: 'OSC',
  serverVersion: '3',
  applicationFetched: false,
};

function generalReducer(state = INITIAL_STATE, action = {}) {
  switch (action.type) {
    case 'SHOW_ERROR_PANEL': {
      return {
        ...state,
        showErrorPanel: action.show,
        errorMessage: action.message,
      };
    }
    case 'SHOW_DIALOG': {
      return {
        ...state,
        showDialog: action.show,
        dialogType: action.t,
        dialogTitle: action.title,
        dialogData: action.data,
      };
    }
    case 'SHOW_CONNECTION_LOST_DIALOG': {
      return { ...state, showConnectionLostDialog: action.show };
    }
    case 'SHOW_CONFIRM_CLEAR_QUEUE_DIALOG': {
      return { ...state, showConfirmClearQueueDialog: action.show };
    }
    case 'SET_INITIAL_STATE': {
      return {
        ...state,
        mode: action.data.general.mode,
        serverVersion: action.data.general.version,
        enable2DPoints: action.data.general.enable_2d_points,
        meshResultFormat: action.data.general.mesh_result_format,
        useNativeMesh: action.data.general.use_native_mesh,
      };
    }
    case 'APPLICATION_FETCHED': {
      return { ...state, applicationFetched: action.data };
    }
    default: {
      return state;
    }
  }
}

export default generalReducer;
