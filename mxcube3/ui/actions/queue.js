import fetch from 'isomorphic-fetch'

export function addSample(id) {
    return { 
    	type: "ADD_SAMPLE", 
    	text: id
    }
}

export function removeSample(id) {
    return { 
      type: "REMOVE_SAMPLE", 
      text: id
    }
}



// // export function requestlogin(proposal, password) {

//   // Thunk middleware knows how to handle functions.
//   // It passes the dispatch method as an argument to the function,
//   // thus making it able to dispatch actions itself.

//   return function (dispatch) {

//     // First dispatch: the app state is updated to inform
//     // that the API call is starting.

//     // dispatch(requestPosts(reddit))

//     // The function called by the thunk middleware can return a value,
//     // that is passed on as the return value of the dispatch method.

//     // In this case, we return a promise to wait for.
//     // This is not required by thunk middleware, but it is convenient for us.

//     return fetch(`http://www.reddit.com/r/reactjs.json`)
//       .then(response => response.json())
//       .then(json =>
        
//         // We can dispatch many times!
//         // Here, we update the app state with the results of the API call.

//         dispatch(addSample("Called async function"))
//       )

//       // In a real world app, you also want to
//       // catch any error in the network call.
//   }
// // }
