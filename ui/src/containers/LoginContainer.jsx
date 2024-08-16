import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from '../components/LoginForm/LoginForm';

function LoginContainer() {
  const loggedIn = useSelector((state) => state.login.loggedIn);

  if (loggedIn) {
    return <Navigate to="/datacollection" replace />;
  }

  return <LoginForm />;
}

export default LoginContainer;
