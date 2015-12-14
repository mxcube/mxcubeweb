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
    case "ADD_METHOD":
      {

        //Declaring the new method to be added to the sample
        let method = {
          name: action.name,
          queue_id: action.queue_id
        }

        //Checking if methods exist on the sample and adding the new method
        let methods = (state.samples_list[action.index].methods ? [...state.samples_list[action.index].methods, method] : [method]);

        // Creating a new SampleItem with the new method attached
        let sample_item = {};
        sample_item[action.index] = Object.assign({}, state.samples_list[action.index], {methods : methods} );

        // Creating new Samplelist
        let samples_list = Object.assign({}, state.samples_list, sample_item);
        
        return Object.assign({}, state, {samples_list: samples_list});
      }
    case "REMOVE_METHOD":
      {

        //Finding the methods list for the sample
        let methods = state.samples_list[action.index].methods;

        // Creating a new SampleItem with the method removed
        let sample_item = {};
        sample_item[action.index] = Object.assign({}, state.samples_list[action.index], {methods :[...methods.slice(0,action.list_index), ...methods.slice(action.list_index + 1, methods.length)]} );
        
        // Creating new Samplelist
        let samples_list = Object.assign({}, state.samples_list, sample_item);
        
        return Object.assign({}, state, {samples_list: samples_list});
      }
    default:
        return state
    }
}
