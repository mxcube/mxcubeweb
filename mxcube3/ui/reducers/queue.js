import {omit} from 'lodash/object';
import {without, xor} from 'lodash/array';
import update from 'react/lib/update';

export default (state={
    queue:{},
    current:{node: null, collapsed: false, running: false},
    todo:{nodes: [], collapsed: false},
    history:{nodes: [], collapsed: false},
    checked: [],
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
                            lookup_queue_id: omit(state.lookup_queue_id, action.index)
                        }
                        );

        // Adding the new task to the queue
        case 'ADD_METHOD':
            return Object.assign({}, state, 
                        {
                            queue : {...state.queue, [action.parent_id] :state.queue[action.parent_id].concat(action.queue_id)},
                            checked: state.checked.concat(action.queue_id)
                        }
                        );

         // Removing the task from the queue
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
                            current: {...state.current, node: action.queue_id, running: false},
                            todo:  {...state.todo, nodes: without(state.todo.nodes, action.queue_id)},
                            history:  {...state.history, nodes: (state.current.node ? state.history.nodes.concat(state.current.node) : state.history.nodes)}
                        }
                        );
        //  UNMount, this will remove the sample from current and add it to history
        case 'UNMOUNT_SAMPLE':
            return Object.assign({}, state, 
                        {
                            current:{node: null, collapsed: false, running: false},
                            history:  {...state.history, nodes: (state.current.node ? state.history.nodes.concat(state.current.node) : state.history.nodes)}
                        }
                        );
        // Run Sample
        case 'RUN_SAMPLE':
            return Object.assign({}, state, 
                        {
                            current : {...state.current, running: true}
                        }
                        );

        case 'TOGGLE_CHECKED':
            return Object.assign({}, state, 
                        {
                            checked:  xor(state.checked, [action.queue_id])
                        }
                        );

        // Collapse list
        case 'COLLAPSE_LIST':
            return {
                ...state,
                [action.list_name] : {...state[action.list_name], collapsed : !state[action.list_name].collapsed }
            }

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
                    current:{node: null, collapsed: false, running: false},
                    todo: {nodes: [], collapsed: false},
                    history: {nodes: [], collapsed: false}
                });
        case 'QUEUE_STATE':
             return action.queueState;
        default:
            return state;
    }
}
