const initialState = {
  data:{ }
}
export default (state=initialState, action) => {
    switch (action.type) {
        case 'LOGIN':
            window.error_notification.clear(); 
            return Object.assign({},state,action) 
        case 'SIGNOUT':
            window.error_notification.clear();
            return Object.assign({},state,initialState)
        default:
            console.log("defalut")
            return state
    }
}
