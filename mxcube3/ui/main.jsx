import 'bootstrap/dist/css/bootstrap.css';

import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import SampleViewContainer from './containers/SampleViewContainer';
import SampleGridViewContainer from './containers/SampleGridViewContainer';
import SampleChangerContainer from './containers/SampleChangerContainer';
import LoginContainer from './containers/LoginContainer';
import LoggerContainer from './containers/LoggerContainer';
import RemoteAccessContainer from './containers/RemoteAccessContainer';
import Main from './components/Main';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { persistStore, autoRehydrate } from 'redux-persist';
import crosstabSync from 'redux-persist-crosstab';
import rootReducer from './reducers';
import { serverIO } from './serverIO';
import { getLoginInfo } from './actions/login';

import 'font-awesome-webpack2';

const store = createStore(rootReducer, applyMiddleware(thunk, createLogger()), autoRehydrate());

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers', () => {
    const nextReducer = require('./reducers');
    store.replaceReducer(nextReducer);
  });
}

function requireAuth(nextState, replace) {
  store.dispatch(getLoginInfo());

  if (!store.getState().login.loggedIn) {
    replace(null, '/login');
  }
}


class ServerStorage {
  setItem(key, value) {
    if (store.getState().remoteAccess.master) {
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


export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { initialized: false };
  }

  componentWillMount() {
    const persistor = persistStore(store,
           { blacklist: ['remoteAccess', 'beamline', 'sampleChanger',
                         'form', 'login', 'general', 'logger', 'points'],
             storage: new ServerStorage() },
             () => {
               serverIO.listen(store);
               this.setState({ initialized: true });
             }
    );

    serverIO.connectStateSocket(persistor);

    crosstabSync(persistor);
  }

  render() {
    if (! this.state.initialized) return <span>Loading...</span>;

    return (<Provider store={store}>
            <Router>
              <Route path="/" component={Main} onEnter={requireAuth}>
               <IndexRoute component={SampleGridViewContainer} />
               <Route path="datacollection" component={SampleViewContainer} />
               <Route path="sampleChanger" component={SampleChangerContainer} />
               <Route path="logging" component={LoggerContainer} />
               <Route path="remoteaccess" component={RemoteAccessContainer} />
              </Route>
              <Route path="login" component={LoginContainer} />
            </Router>
          </Provider>);
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('main')
);
