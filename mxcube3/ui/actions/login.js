export function doLogin(proposal, password) {
  return function (dispatch)  {
    $.ajax({ url: 'mxcube/api/v0.1/login', type: 'GET', data: {proposal:proposal, password: password},
                success: function(data) {
                    dispatch (afterLogin(data));
                }, 
                error: function(req, error_string, exc) {
		    console.log ("ajax error")
                }
            })
     return { type: "LOGGING"} 
  }
}

export function afterLogin(data) {
    return { type: "LOGIN", data}
}

export function doSignOut() {
    return { type: "SIGNOUT" }
}

