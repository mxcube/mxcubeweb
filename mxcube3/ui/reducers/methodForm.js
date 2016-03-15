const initialState = {
  characterisation: false,
  datacollection: false,
  sample_ids: [],
  methodData: {},
  defaultParameters:{parameters:{numImages: 2, transmission: 30, expTime: 10,oscStart: 0.0, oscRange: 0.5, resolution: 2.5, energy: 12.5 , kappa: 0, phi: 0, stratComp: 1, radiationDamage: true }},
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

