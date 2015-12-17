export default (state={
	todo:[],
	history:[],
	current:0,
    selected: {
        queue_id: null,
        sample_id: null
    }
}, action) => {
    switch (action.type) {
        case 'ADD_SAMPLE':
            return Object.assign({},
             			state, 
             			{todo:[...state.todo, {sample_id : action.sample_id, queue_id : action.queue_id}]},           			
             			);
        case 'REMOVE_SAMPLE':
            return Object.assign({},
                        state, 
                        {todo:[...state.todo.slice(0,action.index), ...state.todo.slice(action.index + 1, state.todo.length)]},                     
                        );
        case 'SELECT_SAMPLE':
            return Object.assign({},state, 
                                    {selected: {
                                        queue_id: action.queue_id,
                                        sample_id: action.sample_id,
                                        method: action.method
                                    }
                                    });

        default:
            return state;
    }
}
