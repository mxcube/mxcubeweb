import React from 'react';
import { connect, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { serverIO } from '../serverIO';
import { store, statePersistor } from '../store';
import { getLoginInfo, startSession } from '../actions/login';
import LoginContainer from '../containers/LoginContainer';
import SampleViewContainer from '../containers/SampleViewContainer';
import SampleListViewContainer from '../containers/SampleListViewContainer';
import EquipmentContainer from '../containers/EquipmentContainer';
import LoggerContainer from '../containers/LoggerContainer';
import RemoteAccessContainer from '../containers/RemoteAccessContainer';
import HelpContainer from '../containers/HelpContainer';
import Main from './Main';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';

function requireAuth() {
  let state = store.getState();
  store.dispatch(getLoginInfo()).then(() => {
    state = store.getState();
    if (state.login.loggedIn) {
      store.dispatch(startSession());
    }

    if (state.login.loggedIn && !serverIO.initialized) {
      serverIO.listen(store);
      serverIO.connectStateSocket(statePersistor);
    }
  });
}

function PrivateOutlet() {
  const loggedIn = useSelector((state) => state.login.loggedIn);
  const location = useLocation();
  requireAuth();
  return loggedIn ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}

class App extends React.Component {
  render() {
    requireAuth();

    if (this.props.loggedIn === null) {
      return (<LoadingScreen />);
    }

    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginContainer />} />
          <Route path="/" element={<PrivateOutlet />}>
            <Route path="" element={<Main />}>
              <Route index element={<SampleViewContainer />} />
              <Route path="samplegrid" element={<SampleListViewContainer />} />
              <Route path="datacollection" element={<SampleViewContainer />} />
              <Route path="equipment" element={<EquipmentContainer />} />
              <Route path="logging" element={<LoggerContainer />} />
              <Route path="remoteaccess" element={<RemoteAccessContainer />} />
              <Route path="help" element={<HelpContainer />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    );
  }
}

function mapStateToProps(state) {
  return {
    loggedIn: state.login.loggedIn,
  };
}

export default connect(mapStateToProps)(App);
