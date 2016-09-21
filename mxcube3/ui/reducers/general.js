const initialState = {
  loading: false,
  showErrorPanel: false,
  errorMessage: '',
  dialogMessage: '',
  dialogTitle: '',
  showDialog: false
};

export default (state = initialState, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      {
        return { ...state,
                 loading: action.loading,
                 title: action.title,
                 message: action.message,
                 blocking: action.blocking
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
          dialogTitle: action.title,
          dialogMessage: action.message
        };
      }
    default:
      return state;
  }
};
