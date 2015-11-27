export function doLogin(proposal, password) {
    return { type: "LOGIN", proposal, password }
}

export function doSignOut() {
    return { type: "SIGNOUT" }
}

