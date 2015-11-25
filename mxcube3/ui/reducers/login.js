export default (state={}, action) => {
    switch (action.type) {
        case 'LOGIN':
            let result = {};
            console.log(state);
            // window.error_notification.clear();
     
            // $.ajax({ url: 'mxcube/api/v0.1/login', type: 'GET', data: action, 
            //     success: function(res) {
            //         // res is a Proposal object
            //         result = res;
            //     }, 
            //     error: function(req, error_string, exc) {
            //         window.error_notification.notify(error_string);
            //     }
            // })
            //return { Proposal: { title: "HELLO" } }
            return result
        case 'SIGNOUT':
            window.error_notification.clear();
            return { Proposal: null }
        default:
            return state
    }
}
