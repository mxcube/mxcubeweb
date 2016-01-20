const initialState = {
  data:{},
  status: {},
  loginInfo: {},
  loggedIn: false
}

export default (state=initialState, action) => {
    switch (action.type) {
        case 'LOGIN':
            {
                window.error_notification.clear_noNavBar();

                if (action.status.code == "error") {
                     window.error_notification.notify_noNavBar(action.status.msg);
                     return Object.assign({},state,action, {loggedIn: false});
                }else{
                    return Object.assign({},state,action, {loggedIn: true});
                }
            }
        case 'SIGNOUT':
            {
                window.error_notification.clear();
                return Object.assign({},state,initialState)
            }

        case 'SET_LOGIN_INFO':
            {
                //window.error_notification.clear();
                return Object.assign({},state, 
                    {
                        loginInfo: action.loginInfo
                    });
            }

        default:
            return state
    }
}
