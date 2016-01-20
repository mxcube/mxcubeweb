import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { doLogin, getLoginInfo } from '../actions/login';
import Login from '../components/Login/Login'


class LoginContainer extends Component {

  render() {
 
    return (
    	<Login signIn={this.props.signIn} getLoginInfo={this.props.getLoginInfo} loginInfo={this.props.loginInfo} status={this.props.status}/>
    )
  }
}


function mapStateToProps(state) {
    return { 
        status: state.login.status,
        loginInfo: state.login.loginInfo
        }
}

function mapDispatchToProps(dispatch) {
    return {
        getLoginInfo : bindActionCreators(getLoginInfo, dispatch),
        signIn : bindActionCreators(doLogin, dispatch)
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginContainer);
