import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

import LoginForm from '../components/LoginForm/LoginForm';

function LoginContainer() {
  const loggedIn = useSelector((state) => state.login.loggedIn);
  const location = useLocation();

  if (loggedIn) {
    return <Navigate to={location.state?.from || '/datacollection'} replace />;
  }

  return <LoginForm />;
}

export default LoginContainer;
