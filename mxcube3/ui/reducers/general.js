const initialState = {
    loading: false
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            {
             return {...state, loading : action.loading}
            }
        default:
            return state
    }
}
