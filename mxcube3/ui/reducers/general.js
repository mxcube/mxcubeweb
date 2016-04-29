const initialState = {
  loading: false,
  showErrorPanel:false,
  errorMessage: ''
};

export default (state = initialState, action) => {
  switch (action.type) {
      case 'SET_LOADING':
        {
              return { ...state, loading : action.loading };
            }
      case 'SHOW_ERROR_PANEL':
        {
              return { ...state, showErrorPanel : action.show, errorMessage : action.message };
            }
      default:
        return state;
    }
};
