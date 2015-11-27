export function doLogin(proposal, password) {
    var result = {};
    $.ajax({ url: 'mxcube/api/v0.1/login', type: 'GET', data: {proposal:proposal, password: password},
// not recommended way (Synchronous XMLHttpRequest on the main thread is deprecated), but it works, looking into a better solution. 
                async: false, 
                success: function(data) {
                    // res is a Proposal object
                    result= data;
                }, 
                error: function(req, error_string, exc) {
		    console.log ("ajax error")
                }
            })
    return { type: "LOGIN", result }
}


export function doSignOut() {
    return { type: "SIGNOUT" }
}
