import omit from 'lodash/object/omit';
import without from 'lodash/array/without';
import xor from 'lodash/array/xor';
import union from 'lodash/array/union';  
import intersection from 'lodash/array/intersection';            

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
}, action) => {
    switch (action.type) {

        // Adding sample to queue
        case 'ADD_SAMPLE':
            return Object.assign({},state, 
             			{
                            todo: state.todo.concat(action.queue_id),
                            queue: {...state.queue, [action.queue_id] : [] },
                            lookup: {...state.lookup, [action.queue_id] : action.sample_id}
                        }           			
             			);

        // Removing sample from queue
        case 'REMOVE_SAMPLE':
            return Object.assign({}, state, 
                        {  
                            todo: without(state.todo, action.queue_id),
                            queue: omit(state.queue, action.queue_id),
                            lookup: omit(state.lookup, action.queue_id)
                        }
                        );

        // Change the order of the samples in the queue
         case 'CHANGE_SAMPLE_ORDER':
            return Object.assign({}, state, { todo: action.list });

        // Adding the new method to the queue
        case 'ADD_METHOD':
            return Object.assign({}, state, {queue : {...state.queue, [action.parent_id] :state.queue[action.parent_id].concat(action.queue_id)}});

         // Removing the method from the queue
        case 'REMOVE_METHOD':
            return Object.assign({}, state, {queue : {...state.queue, [action.parent_id] : without(state.queue[action.parent_id], action.queue_id)}});

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
                let siblings_checked = intersection(state.queue[action.parent_queue_id],state.checked);
                if(exist && siblings_checked.length === 1){
                    return Object.assign({},state, {checked: without(state.checked, action.parent_queue_id, action.queue_id)});
                }else{
                    return Object.assign({},state, {checked: union(xor(state.checked, [action.queue_id]),[action.parent_queue_id])});
                }
            }
    
        default:
            return state;
    }
}
