import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom';

import LoginContainer from '../containers/LoginContainer';
import SampleViewContainer from '../containers/SampleViewContainer';
import SampleListViewContainer from '../containers/SampleListViewContainer';
import EquipmentContainer from '../containers/EquipmentContainer';
import RemoteAccessContainer from '../containers/RemoteAccessContainer';
import HelpContainer from '../containers/HelpContainer';
import Main from './Main';
import LoadingScreen from './LoadingScreen/LoadingScreen';

import { serverIO } from '../serverIO';
import { getLoginInfo } from '../actions/login';
import PrivateOutlet from './PrivateOutlet';
import { sendRefreshSession } from '../api/login';

const REFRESH_INTERVAL = 9000;

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
  const loggedIn = useSelector((state) => state.login.loggedIn);

  useEffect(() => {
    dispatch(getLoginInfo());

    if (loggedIn) {
      serverIO.listen();
      const refreshInterval = setInterval(sendRefreshSession, REFRESH_INTERVAL);

      return () => {
        clearInterval(refreshInterval);
        serverIO.disconnect();
      };
    }

    // no clean-up required, until we connect to serverIO
    return undefined;
  }, [loggedIn, dispatch]);

  if (loggedIn === null) {
    // Fetching login info
    return <LoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

export default App;
