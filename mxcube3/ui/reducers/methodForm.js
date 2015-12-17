const initialState = {
  characterisation: false,
  dataCollec: false
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SHOW_FORM':
            {
                let tmp = {};
                tmp[action.name] = true;
                return Object.assign({},state, tmp); 
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

