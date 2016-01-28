const initialState = {
  zoom: 0,
  points: []
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'ZOOM':
            {
             return state;
            }
        default:
            return state;
    }
}
