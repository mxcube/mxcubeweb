import { useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  Outlet,
  Navigate,
} from 'react-router-dom';

import LoginContainer from '../containers/LoginContainer';
import SampleViewContainer from '../containers/SampleViewContainer';
import SampleListViewContainer from '../containers/SampleListViewContainer';
import EquipmentContainer from '../containers/EquipmentContainer';
import LoggerContainer from '../containers/LoggerContainer';
import RemoteAccessContainer from '../containers/RemoteAccessContainer';
import HelpContainer from '../containers/HelpContainer';
import Main from './Main';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';

import { serverIO } from '../serverIO';
import { getLoginInfo } from '../actions/login';
import { bindActionCreators } from 'redux';

function PrivateOutlet() {
  const loggedIn = useSelector((state) => state.login.loggedIn);
  const location = useLocation();

  return loggedIn ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginContainer />,
  },
  {
    path: '/',
    element: <PrivateOutlet />,
    children: [
      {
        path: '',
        element: <Main />,
        children: [
          {
            index: true,
            element: <SampleViewContainer />,
          },
          {
            path: 'samplegrid',
            element: <SampleListViewContainer />,
          },
          {
            path: 'datacollection',
            element: <SampleViewContainer />,
          },
          {
            path: 'equipment',
            element: <EquipmentContainer />,
          },
          {
            path: 'logging',
            element: <LoggerContainer />,
          },
          {
            path: 'remoteaccess',
            element: <RemoteAccessContainer />,
          },
          {
            path: 'help',
            element: <HelpContainer />,
          },
        ],
      },
    ],
  },
]);

function App(props) {
  const { loggedIn, getLoginInfo } = props;

  useEffect(() => {
    getLoginInfo();

    if (loggedIn) {
      serverIO.listen();

      return () => {
        serverIO.disconnect();
      };
    }

    // no clean-up required, until we connect to serverIO
    return undefined;
  }, [loggedIn, getLoginInfo]);

  if (loggedIn === null) {
    // Fetching login info
    return <LoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

export default connect(
  (state) => ({ loggedIn: state.login.loggedIn }),
  (dispatch) => ({ getLoginInfo: bindActionCreators(getLoginInfo, dispatch) }),
)(App);
