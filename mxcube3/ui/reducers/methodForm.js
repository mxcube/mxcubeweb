const initialState = {
  characterisation: false,
  datacollection: false,
  sample_ids: [],
  methodData: {},
  point_id: -1
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SHOW_FORM':
            {
                return Object.assign({},state, {[action.name] : true, sample_ids: action.sample_ids, methodData: action.methodData, point_id: action.point_id}); 
            }
        case 'HIDE_FORM':
            {     

                return initialState;
            }
        default:
            return state
    }
}

