const initialState = {
  clickCentring: false,
  zoom: 0,
  points: []
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'SET_ZOOM':
            {
             return {...state, zoom: action.level};
            }
        case 'START_CLICK_CENTRING':
            {
             return {...state, clickCentring: true};
            }
        case 'STOP_CLICK_CENTRING':
            {
             return {...state, clickCentring: false};
            }
        default:
            return state;
    }
}
