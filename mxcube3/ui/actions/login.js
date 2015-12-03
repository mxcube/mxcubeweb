import fetch from 'isomorphic-fetch'

export function doLogin(proposal, password) {
    return function(dispatch) {
         fetch('mxcube/api/v0.1/login', { method: 'GET', body: {proposal, password} })
            .then(response => response.json())
            .then(json => {
                dispatch(afterLogin(json));
            })
    }
}

export function afterLogin(data) {
    return { type: "LOGIN", data}
}

export function doSignOut() {
    return { type: "SIGNOUT" }
}

