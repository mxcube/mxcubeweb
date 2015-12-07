export default (state={
	todo:[],
	history:[],
	current:0
}, action) => {
    switch (action.type) {
        case 'ADD_SAMPLE':

        	let index = state.index +1;
        	
            return Object.assign({},
             			state, 
             			{todo:[...state.todo, action.type]},
             			
             			);
        default:
            return state;
    }
}
