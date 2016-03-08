import {omit} from 'lodash/object';
import {without, xor, union, intersection} from 'lodash/array';
import update from 'react/lib/update';

export default (state={
    queue:{},
    todo:{nodes: [], collapsed: false},
    history:{nodes: [], collapsed: false},
    checked: [],
    current:{node: null, collapsed: false},
    selected: {
        queue_id: null,
        sample_id: null,
        method: null,
        list_index: 0
    },
    lookup:{},
    lookup_queue_id:{},
    searchString: ""
}, action) => {
    switch (action.type) {

        // Adding sample to queue
        case 'ADD_SAMPLE':
            return Object.assign({},state, 
                        {
                            todo: {...state.todo, nodes: state.todo.nodes.concat(action.queue_id)},
                            queue: {...state.queue, [action.queue_id] : [] },
                            lookup: {...state.lookup, [action.queue_id] : action.sample_id},
                            lookup_queue_id: {...state.lookup_queue_id, [action.sample_id] : action.queue_id}
                        }                       
                        );

        // Removing sample from queue
        case 'REMOVE_SAMPLE':
            return Object.assign({}, state,
                        {
                            todo: {...state.todo, nodes: without(state.todo.nodes, action.queue_id)},
                            queue: omit(state.queue, action.queue_id),
                            lookup: omit(state.lookup, action.queue_id),
                            lookup_queue_id: omit(state.lookup_queue_id, action.sample_id)
                        }
                        );

        // Adding the new method to the queue
        case 'ADD_METHOD':
            return Object.assign({}, state, 
                        {
                            queue : {...state.queue, [action.parent_id] :state.queue[action.parent_id].concat(action.queue_id)},
                            checked: state.checked.concat(action.queue_id)
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
                            current: {...state.current, node: action.queue_id},
                            todo:  {...state.todo, nodes: without(state.todo.nodes, action.queue_id)},
                            history:  {...state.history, nodes: (state.current.node ? state.history.nodes.concat(state.current.node) : [])},
                            checked: without(state.checked, action.queue_id)
                        }
                        );

        // Run Sample
        case 'RUN_SAMPLE':
            return Object.assign({}, state, 
                        {
                            current : action.queue_id,
                            todo:  {...state.todo, nodes: without(state.todo.nodes, action.queue_id)}
                        }
                        );

        // Collapse list
        case 'COLLAPSE_LIST':
            return {
                ...state,
                [action.list_name] : {...state[action.list_name], collapsed : !state[action.list_name].collapsed }
            }


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
        // Change order of samples in queue on drag and drop
        case 'CHANGE_QUEUE_ORDER':
   
            return {
                ...state,
                [action.listName] : {...state[action.listName], 
                    nodes : update(state[action.listName].nodes, {
                        $splice: [
                            [action.oldIndex, 1],
                            [action.newIndex, 0, state[action.listName].nodes[action.oldIndex]]
                    ]})}
                };

        // Change order of samples in queue on drag and drop
        case 'CHANGE_METHOD_ORDER':
   
            return {
                ...state,
                queue : {...state.queue, 
                    [action.sampleId] : update(state.queue[action.sampleId], {
                        $splice: [
                            [action.oldIndex, 1],
                            [action.newIndex, 0, state.queue[action.sampleId][action.oldIndex]]
                    ]})}
                };


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

            break;
        case 'redux-form/CHANGE':
            if(action.form === "search-sample"){
                return Object.assign({}, state, {searchString : action.value});
            }else{
                return state;
            }
            break;
        case 'CLEAR_QUEUE':
             return Object.assign({}, state, 
                {
                    current: 0,
                    todo: {nodes: [], collapsed: false},
                    history: []
                });
        case 'QUEUE_STATE':
             return action.queueState;
        default:
            return state;
    }
}
