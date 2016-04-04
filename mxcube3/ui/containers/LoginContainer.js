import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { doLogin, getLoginInfo } from '../actions/login';
import { setLoading } from '../actions/general';
import Login from '../components/Login/Login'


class LoginContainer extends Component {

    render() {
        return (
            <Login signIn={this.props.signIn} getLoginInfo={this.props.getLoginInfo} loginInfo={this.props.loginInfo} setLoading={this.props.setLoading} loading={this.props.loading} status={this.props.status}/>
        )
    }
}


function mapStateToProps(state) {
    return { 
        status: state.login.status,
        loginInfo: state.login.loginInfo,
        loading: state.general.loading
    }
}

function mapDispatchToProps(dispatch) {
    return {
        getLoginInfo : bindActionCreators(getLoginInfo, dispatch),
        signIn : bindActionCreators(doLogin, dispatch),
        setLoading : bindActionCreators(setLoading, dispatch)
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginContainer);
