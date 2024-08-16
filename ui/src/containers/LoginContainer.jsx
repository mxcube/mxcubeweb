import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { logIn } from '../actions/login';
import Login from '../components/Login/Login';

function LoginContainer(props) {
  const location = useLocation();

  return props.data.loggedIn === false ? (
    <Login {...props} />
  ) : (
    <Navigate to="/datacollection" state={{ from: location }} replace />
  );
}

function mapStateToProps(state) {
  return {
    showError: state.general.showErrorPanel,
    errorMessage: state.general.errorMessage,
    data: state.login,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    logIn: bindActionCreators(logIn, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginContainer);
