import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { signIn } from '../actions/login';
import { setLoading } from '../actions/general';
import Login from '../components/Login/Login';


class LoginContainer extends Component {
  render() {
    return (
      <Login
        {...this.props}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    loading: state.general.loading,
    showError: state.general.showErrorPanel
  };
}

function mapDispatchToProps(dispatch) {
  return {
    signIn: bindActionCreators(signIn, dispatch),
    setLoading: bindActionCreators(setLoading, dispatch)
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginContainer);
