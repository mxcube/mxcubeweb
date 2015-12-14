const initialState = {
  data:{ }
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'LOGIN':
            {
                window.error_notification.clear(); 
                let login_status = action.data.status;
                if (login_status.code === "error") {
                    window.error_notification.notify("Authentication failed.");    
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

