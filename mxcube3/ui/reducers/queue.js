import {omit} from 'lodash/object';
import {without, xor, union, intersection, filter} from 'lodash/array';

export default (state={
    queue:{},
	todo:[],
	history:[],
    checked: [],
	current:0,
    selected: {
        queue_id: null,
        sample_id: null,
        method: null,
        list_index: 0
    },
    selectAll: false,
    lookup:{},
    lookup_queue_id:{},
    searchString: ""
}, action) => {
    switch (action.type) {

        // Adding sample to queue
        case 'ADD_SAMPLE':
            return Object.assign({},state, 
             			{
                            todo: state.todo.concat(action.queue_id),
                            queue: {...state.queue, [action.queue_id] : [] },
                            lookup: {...state.lookup, [action.queue_id] : action.sample_id},
                            lookup_queue_id: {...state.lookup_queue_id, [action.sample_id] : action.queue_id}
                        }           			
             			);

        // Removing sample from queue
        case 'REMOVE_SAMPLE':
            return Object.assign({}, state,
                        {
                            todo: without(state.todo, action.queue_id),
                            queue: omit(state.queue, action.queue_id),
                            lookup: omit(state.lookup, action.queue_id),
                            lookup_queue_id: omit(state.lookup_queue_id, action.sample_id)
                        }
                        );

        // Change the order of the samples in the queue
         case 'CHANGE_SAMPLE_ORDER':
            return Object.assign({}, state, { todo: action.list });

        // Adding the new method to the queue
        case 'ADD_METHOD':
            return Object.assign({}, state, 
                        {
                            queue : {...state.queue, [action.parent_id] :state.queue[action.parent_id].concat(action.queue_id)},
                            checked: state.checked.concat(action.queue_id),
                        }
                        );

         // Removing the method from the queue
        case 'REMOVE_METHOD':
            return Object.assign({}, state, 
                        {
                            queue : {...state.queue, [action.parent_id] : without(state.queue[action.parent_id], action.queue_id)},
                            checked: without(state.checked, action.queue_id)
                        }
                        );

        // Run Mount, this will add the mounted sample to history and if it is 0 it will be removed as it is the default value
        case 'MOUNT_SAMPLE':
            return Object.assign({}, state, 
                        {
                            current : action.queue_id,
                            todo: without(state.todo, action.queue_id),
                            history: without(state.history.concat(state.current), 0),
                        }
                        );

        // Run Sample
        case 'RUN_SAMPLE':
            return Object.assign({}, state, 
                        {
                            current : action.queue_id,
                            todo: without(state.todo, action.queue_id),
                        }
                        );

         // Run Sample or Method
        case 'FINISH_SAMPLE':
            return Object.assign({}, state, 
                        {
                            history: state.history.concat(action.queue_id),
                            todo: without(state.todo, action.queue_id),
                            checked: without(state.checked, action.queue_id),
                            current : 0
                        }
                        );

         // Selecting node in the gui
        case 'SELECT_SAMPLE':
            return Object.assign({},state, 
                                    {selected: {
                                        queue_id: action.queue_id,
                                        sample_id: action.sample_id,
                                        method: action.method,
                                        parent_queue_id: action.parent_queue_id

                                    }
                                    });

        // Toogles checkboxes for sample and method nodes
        case 'TOGGLE_CHECKBOX':

            let exist = state.checked.indexOf(action.queue_id) !== -1;
            // Checking if node is sample or method
            if(action.parent_queue_id === -1){
                let children = state.queue[action.queue_id];
                if(exist){
                    return Object.assign({},state, {checked: without(xor(state.checked, [action.queue_id]), ...children) });
                }else{
                    return Object.assign({},state, {checked: union(xor(state.checked, [action.queue_id]), children)});
                }
            }else{
                let methods_checked = intersection(state.queue[action.parent_queue_id],state.checked);
                if(exist && methods_checked.length === 1){
                    return Object.assign({},state, {checked: without(state.checked, action.parent_queue_id, action.queue_id)});
                }else{
                    return Object.assign({},state, {checked: union(xor(state.checked, [action.queue_id]),[action.parent_queue_id])});
                }
            }
        case 'redux-form/CHANGE':
            if(action.form === "search-sample"){
                return Object.assign({}, state, {searchString : action.value});
            }else{
                return state;
            }
    
        case 'CLEAR_QUEUE':
             return Object.assign({}, state, 
                {
                    current: 0,
                    todo: [],
                    history: []
                });
        default:
            return state;
    }
}
