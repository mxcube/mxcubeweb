import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-table/css/react-bootstrap-table.css';
import './main.css';
import React from 'react';
import { render } from 'react-dom';

import { BrowserRouter ,
  Routes,
  Route, Navigate,
  Outlet
} from 'react-router-dom';

import { createBrowserHistory } from 'history'
import { createStore, applyMiddleware, compose} from 'redux';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web


import { PersistGate } from 'redux-persist/integration/react';
import { ConnectedRouter } from 'connected-react-router';

import * as serviceWorker from './serviceWorker';

// import crosstabSync from 'redux-persist-crosstab';
import SampleViewContainer from './containers/SampleViewContainer';
import SampleGridViewContainer from './containers/SampleGridViewContainer';
import SampleChangerContainer from './containers/SampleChangerContainer';
import LoginContainer from './containers/LoginContainer';
import LoggerContainer from './containers/LoggerContainer';
import RemoteAccessContainer from './containers/RemoteAccessContainer';
import HelpContainer from './containers/HelpContainer';
import Main from './components/Main';
import rootReducer from './reducers';
import { serverIO } from './serverIO';
import { getLoginInfo, startSession } from './actions/login';
import logo from './img/mxcube_logo20.png';
import loadingAnimation from './img/loading-animation.gif';

import '@fortawesome/fontawesome-free/css/all.min.css';
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

// Add all icons to the library so you can use it in your page
library.add(fas, far, fab)


export const history = createBrowserHistory();

// Logger MUST BE the last middleware
const middleware = [
  thunk,
  createLogger()
];

// passing several store enhancers to createStore need to be compose together
const composedEnhancers = compose(
  applyMiddleware(...middleware),
  // autoRehydrate()
);


const persistConfig = {
  key: 'root',
  blacklist: ['remoteAccess', 'beamline', 'sampleChanger',
  'form', 'login', 'general', 'logger', 'shapes',
  'sampleView', 'taskResult', 'sampleChangerMaintenance', 'uiproperties'],
  // storage: new ServerStorage()
  storage,
}
 
const persistedReducer = persistReducer(persistConfig, rootReducer)


const store = createStore(persistedReducer, composedEnhancers);

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers', () => {
    const nextReducer = require('./reducers');
    store.replaceReducer(nextReducer);
  });
}

class ServerStorage {
  setItem(key, value) {
    if (store.getState().login.user.inControl) {
      serverIO.uiStorage.setItem(key, value);
    }
  }

  getItem(key, cb) {
    serverIO.uiStorage.getItem(key, cb);
  }

  removeItem(key) {
    serverIO.uiStorage.removeItem(key);
  }

  getAllKeys(cb) {
    serverIO.uiStorage.getAllKeys(cb);
  }
}

const persistor = persistStore(store);
// ,
//   {
//     blacklist: ['remoteAccess', 'beamline', 'sampleChanger',
//       'form', 'login', 'general', 'logger', 'shapes',
//       'sampleView', 'taskResult', 'sampleChangerMaintenance', 'uiproperties'],
//     storage: new ServerStorage()
//   },
//   () => {
//     /* eslint-disable react/no-set-state */
//     // this.setState({ initialized: true });
//     /* eslint-enable react/no-set-state */
//   });

function requireAuth(nextState, replace, callback) {
  let state = store.getState();
  store.dispatch(getLoginInfo()).then(() => {
    state = store.getState();
    if (!state.login.loggedIn) {
      replace('/login');
    } else {

      serverIO.connectStateSocket(persistor);
      // crosstabSync(persistor);

      serverIO.listen(store);
      store.dispatch(startSession());
    }
    return callback();
  });
}

function useAuth() {
  let state = store.getState();
  store.dispatch(getLoginInfo()).then(() => {
    state = store.getState();
    if (state.login.loggedIn) {

      serverIO.connectStateSocket(persistor);
      serverIO.listen(store);
      store.dispatch(startSession());
    }

    return state.login.loggedIn;
  });

  return state.login.loggedIn;
}


function PrivateOutlet() {
  const auth = useAuth();
  console.log(auth);
  return auth ? <Outlet /> : <Navigate to="/login" />;
}

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { initialized: false };
  }

  componentWillMount() {
    serverIO.connectNetworkSocket(() => {
      /* eslint-disable react/no-set-state */
      this.setState({ initialized: true });
      /* eslint-enable react/no-set-state */
    });
  }

  render() {
    if (!this.state.initialized) {
      return (
      <div id="loading">
        <img className="logo" src={logo} role="presentation" />
        <div><h3>Loading, please wait</h3> <img className="loader-init" src={loadingAnimation} role="presentation" /></div>
      </div>
      );
    }

    return (
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          {/* <ConnectedRouter history={history}> */}
            <BrowserRouter history={history}>
              <Routes>
                <Route path="/login" element={<LoginContainer />} /> 
                <Route element={<PrivateOutlet />}>
                  <Route path="/" element={<Main />}>
                    <Route index element={<SampleViewContainer />} />
                    <Route path="samplegrid" element={<SampleGridViewContainer />} />
                    <Route path="datacollection" element={<SampleViewContainer />} />
                    <Route path="samplechanger" element={<SampleChangerContainer />} />
                    <Route path="logging" element={<LoggerContainer />} />
                    <Route path="remoteaccess" element={<RemoteAccessContainer />} />
                    <Route path="help" element={<HelpContainer />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          {/* </ConnectedRouter> */}
        </PersistGate>
      </Provider>
    );
  }
}

const rootElement = document.getElementById("root");

render(
  <App />,
  rootElement
);