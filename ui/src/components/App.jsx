import { useEffect } from 'react';
import { useErrorBoundary } from 'react-error-boundary';
import { useDispatch, useSelector } from 'react-redux';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';

import { getLoginInfo } from '../actions/login';
import { sendRefreshSession } from '../api/login';
import EquipmentContainer from '../containers/EquipmentContainer';
import HelpContainer from '../containers/HelpContainer';
import LoginContainer from '../containers/LoginContainer';
import RemoteAccessContainer from '../containers/RemoteAccessContainer';
import SampleListViewContainer from '../containers/SampleListViewContainer';
import SampleViewContainer from '../containers/SampleViewContainer';
import { serverIO } from '../serverIO';
import LoadingScreen from './LoadingScreen/LoadingScreen';
import Main from './Main';
import PrivateOutlet from './PrivateOutlet';

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
            path: 'remoteaccess',
            element: <RemoteAccessContainer />,
          },
          {
            path: 'help',
            element: <HelpContainer />,
          },
          {
            // Redirect `/` and any unknown route to `/datacollection`
            path: '*?',
            element: <Navigate to="/datacollection" replace />,
          },
        ],
      },
    ],
  },
]);

function App() {
  const dispatch = useDispatch();
  const { showBoundary } = useErrorBoundary();
  const loggedIn = useSelector((state) => state.login.loggedIn);

  const sessionRefreshInterval = useSelector(
    (state) => state.login.sessionRefreshInterval,
  );

  useEffect(() => {
    // Fetch login info on mount
    dispatch(getLoginInfo()).catch(showBoundary); // eslint-disable-line promise/prefer-await-to-then
  }, [dispatch, showBoundary]);

  useEffect(() => {
    if (loggedIn) {
      serverIO.listen();
      const refreshInterval = setInterval(
        sendRefreshSession,
        sessionRefreshInterval,
      );

      return () => {
        clearInterval(refreshInterval);
        serverIO.disconnect();
      };
    }

    // no clean-up required, until we connect to serverIO
    return undefined;
  }, [loggedIn, sessionRefreshInterval]);

  if (loggedIn === null) {
    // Fetching login info
    return <LoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

export default App;
