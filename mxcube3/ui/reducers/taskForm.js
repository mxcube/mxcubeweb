const initialState = {
  sampleIds: [],
  taskData: {},
  pointId: -1,
  showForm: '',
  defaultParameters:{parameters: {numImages: 2, transmission: 30, expTime: 10,oscStart: 0.0, oscRange: 0.5, resolution: 2.5, energy: 12.5 , kappa: 0, phi: 0, stratComp: 1, radiationDamage: true} }
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SHOW_FORM':
            {
                return Object.assign({}, state, {showForm : action.name, sampleIds: action.sample_ids, taskData: action.taskData, pointId: action.point_id }); 
            }
        case 'HIDE_FORM':
            {     
                return initialState;
            }
        default:
            return state
    }
}

