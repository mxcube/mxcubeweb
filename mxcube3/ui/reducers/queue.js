export default (state={
	samples:{},
	index: 0,
	todo:[],
	history:[],
	current:0
}, action) => {
    switch (action.type) {
        case 'ADD_SAMPLE':

        	let index = state.index +1;
        	let sample = {};
        	sample[index] = {
        		//Add sample information here
        		info: "Sample " + index
        	};


            return Object.assign({},
             			state, 
             			{ samples: Object.assign({}, 
             			state.samples, sample)}, 
             			{index: index},
             			{todo:[...state.todo, index]}
             			);
        default:
            return state;
    }
}
