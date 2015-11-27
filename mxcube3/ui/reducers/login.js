export default (state={}, action) => {
    switch (action.type) {
        case 'LOGIN':
// moved the login ajax to actions, since "Redux assumes that you never mutate the objects it gives to you in the reducer. Every single time, you must return the new state object"
            window.error_notification.clear(); 
            return action.result
//            return Object.assign(action.result)
        case 'SIGNOUT':
            window.error_notification.clear();
            return { Proposal: null }
        default:
            return state
    }
}
