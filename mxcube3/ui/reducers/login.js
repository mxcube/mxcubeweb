const initialState = {
  data:{ },
  status: null
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'LOGIN':
            {
                window.error_notification.clear_noNavBar();
                if (action.status.code == "error") {
                     window.error_notification.notify_noNavBar(action.status.msg);
                }
                return Object.assign({},state,action)
            }
        case 'SIGNOUT':
            {
                window.error_notification.clear();
                return Object.assign({},state,initialState)
            }
        default:
            return state
    }
}
