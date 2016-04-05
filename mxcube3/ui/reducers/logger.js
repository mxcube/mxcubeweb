const initialState = {
    logRecords : []
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'ADD_LOG_RECORD':
            {
             return {...state, logRecords : [...state.logRecords, action.data]}
            }
        default:
            return state

    }
}
