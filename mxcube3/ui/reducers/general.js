const initialState = {
    loading: false,
    showErrorPanel:false,
    errorMessage: "",
    showPopOver: ""
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            {
             return {...state, loading : action.loading}
            }
        case 'SHOW_POP_OVER':
            {
             return {...state, showPopOver : action.name}
            }
        case 'SHOW_ERROR_PANEL':
            {
             return {...state, showErrorPanel : action.show, errorMessage : action.message}
            }
        default:
            return state
    }
}
