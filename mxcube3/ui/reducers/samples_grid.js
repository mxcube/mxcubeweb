export default (state={ samples_list: [], filter_text: "" }, action) => {
    switch (action.type) {
    case "UPDATE_SAMPLES":
        return Object.assign({}, state, { samples_list: action.samples_list });
    case "TOGGLE_SELECTED":
      {
        let sample_item = state.samples_list[action.index]
        let selected = !sample_item.selected;
    	//if (! sample_item.loadable) { selected = false };
        sample_item.selected = selected;
        let samples_list = [ ...state.samples_list.slice(0, action.index),
                           sample_item, 
                           ...state.samples_list.slice(action.index+1) ]
	return Object.assign({}, state, { samples_list });
      }
    case "SELECT_ALL":
      { 
        let samples_list = state.samples_list.map(s => { s.selected = true; return s });
        return Object.assign({}, state, { samples_list }); 
      }
    case "FILTER":
      {
        return Object.assign({}, state, { filter_text: action.filter_text });
      }
    default:
        return state
    }
}
