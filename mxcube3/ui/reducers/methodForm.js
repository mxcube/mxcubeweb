const initialState = {
  characterisation: false,
  datacollection: false,
  point: false
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SHOW_FORM':
            {
                return Object.assign({},state, {[action.name] : true, point: action.point}); 
            }
        case 'HIDE_FORM':
            {     
                let tmp = {};
                tmp[action.name] = false;
                return Object.assign({},state, tmp); 
            }
        default:
            return state
    }
}

