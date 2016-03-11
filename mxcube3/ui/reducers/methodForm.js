const initialState = {
  sample_ids: [],
  methodData: {},
  point_id: -1
  showForm: ''
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SHOW_FORM':
            {
                return Object.assign({}, state, {showForm : action.name, sample_ids: action.sample_ids, methodData: action.methodData, point_id: action.point_id }); 
            }
        case 'HIDE_FORM':
            {     
                return initialState;
            }
        default:
            return state
    }
}

