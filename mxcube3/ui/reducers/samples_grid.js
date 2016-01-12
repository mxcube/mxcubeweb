export default (state={ samples_list: {}, filter_text: "", selected: {}, manual_mount: false, login_data: {} }, action) => {
    switch (action.type) {
    case "UPDATE_SAMPLES":
          // should have session samples
          return Object.assign({}, state, { samples_list: action.samples_list });
    case "TOGGLE_SELECTED":
      {
          let new_selected = Object.assign({}, state.selected);
          new_selected[action.index]=!state.selected[action.index];
          return Object.assign({}, state, {selected: new_selected });
      }
    case "SELECT_ALL":
      { 
          // Creating a new SampleList with the "selected" state toggled to "true"
          let new_selected = {};
          Object.keys(state.samples_list).forEach(function (key) {
              new_selected[key] = action.selected;
          });

          return Object.assign({}, state,  {selected: new_selected}); 
      }
    case "FILTER":
      {
          return Object.assign({}, state, { filter_text: action.filter_text });
      }
    case "SET_SAMPLES_INFO":
      {
          let samples_list = {};
          Object.keys(state.samples_list).forEach(key => {
              let sample = state.samples_list[key];
              let sample_info;
              for (sample_info of action.sample_info_list) {
                  if (sample_info.code) {
                      // find sample with data matrix code
                      if (sample.code == sample_info.code) {
                          samples_list[key] = Object.assign({}, sample, { sample_info: sample_info });
                          break;
                      }
                  } else {
                      // check with sample changer location
                      let lims_location = sample_info.containerSampleChangerLocation+":"+sample_info.sampleLocation;
                      if (sample.location == lims_location) { 
                          samples_list[key] = Object.assign({}, sample, { sample_info: sample_info });
                          break;
                      }
                  }
              }    
              if (samples_list[key] === undefined) {
                  samples_list[key] = Object.assign({}, sample, { sample_info: null });
              }
          });
          return Object.assign({}, state, { samples_list: samples_list });
      }
    case "SET_MANUAL_MOUNT":
      {
          return Object.assign({}, state, { manual_mount: action.manual });
      }
    case "ADD_METHOD":
      {

        //Declaring the new method to be added to the sample
        let method = {
          name: action.name,
          queue_id: action.queue_id,
          parameters : action.parameters
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
    case "CHANGE_METHOD":
      {    
          // Creating a new SampleItem with the method changed
          let list_index = 0;

          let methods = state.samples_list[action.index].methods;

           methods.map((method,index) =>{
            if(method.queue_id === action.queue_id){
              list_index = index;
            }
           });

          let method = Object.assign({}, methods[list_index], {parameters: action.parameters});


          let sample_item = {};
          sample_item[action.index] = Object.assign({}, state.samples_list[action.index], {methods : [...methods.slice(0,list_index), method, ...methods.slice(list_index + 1, methods.length)]}  );

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
