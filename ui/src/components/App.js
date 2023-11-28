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

import { store } from '../store';
import { serverIO } from '../serverIO';
import { applicationFetched } from '../actions/general';
import { getInitialState } from '../actions/login';

export async function requireAuth() {
  try {
    store.dispatch(applicationFetched(false));
    await store.dispatch(getInitialState());
    serverIO.listen();
  } catch {
    store.dispatch(applicationFetched(true));
  }
}

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
  const { applicationFetched } = props;

  useEffect(() => {
    requireAuth();
    return () => {
      serverIO.disconnect();
    };
  }, []);

  if (!applicationFetched) {
    // Fetching login info
    return <LoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

function mapStateToProps(state) {
  return {
    loggedIn: state.login.loggedIn,
    applicationFetched: state.general.applicationFetched,
  };
}

export default connect(mapStateToProps)(App);
