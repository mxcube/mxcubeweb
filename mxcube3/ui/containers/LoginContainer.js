import { connect } from 'react-redux'
import LoginForm from '../components/Login'
import { doLogin, doSignOut } from '../actions/login'

function mapStateToProps(state) {
    return { status: state.login.status}
}

function mapDispatchToProps(dispatch) {
    return {
        signIn: (proposal, password) => dispatch(doLogin(proposal, password))
//        signOut: () => dispatch(doSignOut())
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginForm);
