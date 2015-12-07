export default (state={
	todo:[],
	history:[],
	current:0
}, action) => {
    switch (action.type) {
        case 'ADD_SAMPLE':

            return Object.assign({},
             			state, 
             			{todo:[...state.todo, action.id]},
             			
             			);
        default:
            return state;
    }
}
