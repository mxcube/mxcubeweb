export default (state={ samples_list: {} }, action) => {
    switch (action.type) {
    case "UPDATE_SAMPLES":
        return Object.assign({}, state, { samples_list: action.samples_list });
    case "TOGGLE_SELECTED":
        let sample_item = {}
        sample_item[action.index] = state.samples_list[action.index];
        sample_item[action.index].selected = !sample_item[action.index].selected ;
    

	return Object.assign({}, state, { sample_item  });
    default:
        return state
    }
}
