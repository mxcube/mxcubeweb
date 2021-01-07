const initialState = {
  loading: false,
  showErrorPanel: false,
  errorMessage: '',
  dialogData: '',
  dialogTitle: '',
  dialogType: '',
  showDialog: false,
  showConnectionLostDialog: false,
  showConfirmClearQueueDialog: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOADING':
    {
      return {
        ...state,
        loading: action.loading,
        title: action.title,
        message: action.message,
        blocking: action.blocking,
        abortFun: action.abortFun
      };
    }
    case 'SHOW_ERROR_PANEL':
    {
      return { ...state, showErrorPanel: action.show, errorMessage: action.message };
    }
    case 'SHOW_DIALOG':
    {
      return {
        ...state,
        showDialog: action.show,
        dialogType: action.t,
        dialogTitle: action.title,
        dialogData: action.data
      };
    }
    case 'SHOW_CONNECTION_LOST_DIALOG':
    {
      return { ...state, showConnectionLostDialog: action.show };
    }
    case 'SHOW_CONFIRM_CLEAR_QUEUE_DIALOG':
    {
      return { ...state, showConfirmClearQueueDialog: action.show };
    }
    default:
      return state;
  }
};
