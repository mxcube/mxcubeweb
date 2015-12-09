import { addSample } from '../actions/queue'

export default (state={ samples_list: {}, filter_text: "" }, action) => {
    switch (action.type) {
    case "UPDATE_SAMPLES":
        return Object.assign({}, state, { samples_list: action.samples_list });
    case "TOGGLE_SELECTED":
      {
        // Creating a new SampleItem with the "selected" state toggled
        let sample_item = {};
        sample_item[action.index] = Object.assign({}, state.samples_list[action.index], {selected : !state.samples_list[action.index].selected}  );

        // Creating new Samplelist
        let samples_list = Object.assign({}, state.samples_list, sample_item);

    return Object.assign({}, state, {samples_list: samples_list});
      }
    case "SELECT_ALL":
      { 
        // Creating a new SampleList with the "selected" state toggled to "true"
        let samples_list = {};
        Object.keys(state.samples_list).forEach(function (key) {
            samples_list[key] = Object.assign({}, state.samples_list[key], {selected : true}  );
        });

        return Object.assign({}, state,  {samples_list: samples_list}); 
      }
    case "FILTER":
      {
        return Object.assign({}, state, { filter_text: action.filter_text });
      }
    default:
        return state
    }
}
