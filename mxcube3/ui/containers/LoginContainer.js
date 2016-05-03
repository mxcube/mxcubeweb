import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { doLogin, getLoginInfo } from '../actions/login';
import { setLoading } from '../actions/general';
import Login from '../components/Login/Login';


class LoginContainer extends Component {

  render() {
    const { showError, loading, loginInfo, status, getLoginInfo, signIn, setLoading } = this.props;

    return (
            <Login
              signIn={signIn}
              getLoginInfo={getLoginInfo}
              loginInfo={loginInfo}
              setLoading={setLoading}
              loading={loading}
              status={status}
              showError={showError}
            />
        );
  }
}


function mapStateToProps(state) {
  return {
    status: state.login.status,
    loginInfo: state.login.loginInfo,
    loading: state.general.loading,
    showError :state.general.showErrorPanel
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getLoginInfo : bindActionCreators(getLoginInfo, dispatch),
    signIn : bindActionCreators(doLogin, dispatch),
    setLoading : bindActionCreators(setLoading, dispatch)
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginContainer);
