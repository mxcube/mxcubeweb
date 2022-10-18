import 'bootstrap/dist/css/bootstrap.css';

import './main.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router , Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { Provider } from 'react-redux';
import SampleViewContainer from './containers/SampleViewContainer';
import SampleGridViewContainer from './containers/SampleGridViewContainer';
import EquipmentContainer from './containers/EquipmentContainer';
import LoginContainer from './containers/LoginContainer';
import LoggerContainer from './containers/LoggerContainer';
import RemoteAccessContainer from './containers/RemoteAccessContainer';
import HelpContainer from './containers/HelpContainer';
import Main from './components/Main';
import { serverIO } from './serverIO';
import { getLoginInfo, startSession } from './actions/login';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';


import {store, statePersistor, localStatePersistor} from './store';

import '@fortawesome/fontawesome-free/css/all.min.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

// Add all icons to the library so you can use it in your page
library.add(fas, far, fab);

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers', () => {
    const nextReducer = require('./reducers');
    store.replaceReducer(nextReducer);
  });
}

function requireAuth() {
  let state = store.getState();
  store.dispatch(getLoginInfo()).then(() => {
    state = store.getState();
    if (state.login.loggedIn) {
      serverIO.connectStateSocket(statePersistor);
      serverIO.listen(store);
      store.dispatch(startSession());
    }
  });
  state = store.getState();
  return state.login.loggedIn;
}

function PrivateOutlet() {
  const location = useLocation();
  const auth = requireAuth();
  return auth ? <Outlet /> : <Navigate to="/login" state={{ from: location }}  replace />;
}

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { initialized: false };
  }

  componentWillMount() {
    serverIO.connectNetworkSocket(() => {
      this.setState({ initialized: true });
    });
  }

  render() {
    if (!this.state.initialized)  {
      return (<LoadingScreen /> );
    }

    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={localStatePersistor}>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginContainer />} /> 
              <Route path="/" element={<PrivateOutlet />}>
                <Route path="" element={<Main />}>
                  <Route index element={<SampleViewContainer />} />
                  <Route path="samplegrid" element={<SampleGridViewContainer />} />
                  <Route path="datacollection" element={<SampleViewContainer />} />
                  <Route path="equipment" element={<EquipmentContainer />} />
                  <Route path="logging" element={<LoggerContainer />} />
                  <Route path="remoteaccess" element={<RemoteAccessContainer />} />
                  <Route path="help" element={<HelpContainer />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </PersistGate>
      </Provider>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('#root'));
