export default (state={ selected: false, loadable: false, tags: [] }, action) => {
    switch (action.type) {
    case 'TOGGLE_SELECTED':
	let selected = !state.selected;
    	if (! state.loadable) { selected = false }
        return Object.assign({}, state, { selected });
    case 'SET_LOADABLE':
        return Object.assign({}, state, { loadable: action.loadable });
    case "ADD_TAG":
        let new_tags = action.tag.match(/[^ ]+/g);
        let tags = state.tags.concat(new_tags);
        return Object.assign({}, state, { tags });
    default:
        return state
    }
}
