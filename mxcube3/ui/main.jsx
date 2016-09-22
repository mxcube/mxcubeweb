import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import SampleViewContainer from './containers/SampleViewContainer';
import SampleGridContainer from './containers/SampleGridContainer';
import SampleChangerContainer from './containers/SampleChangerContainer';
import LoginContainer from './containers/LoginContainer';
import LoggerContainer from './containers/LoggerContainer';
import Main from './components/Main';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { persistStore, autoRehydrate } from 'redux-persist';
import crosstabSync from 'redux-persist-crosstab';
import rootReducer from './reducers';
import ServerIO from './serverIO';
import 'font-awesome-webpack';
import { getLoginInfo } from './actions/login';
require('file?name=[name].[ext]!index.html');

const store = createStore(rootReducer, applyMiddleware(thunk, createLogger()), autoRehydrate());

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  module.hot.accept('./reducers', () => {
    const nextReducer = require('./reducers');
    store.replaceReducer(nextReducer);
  });
}

function requireAuth(nextState, replace) {
  if (!store.getState().login.loggedIn) {
    replace(null, '/login');
  }
}


class ServerStorage {
  constructor(serverIO) {
    this.serverIO = serverIO;
  }

  setItem(key, value) {
    if (store.getState().remoteAccess.master) {
      this.serverIO.uiStorage.setItem(key, value);
    }
  }

  getItem(key, cb) {
    this.serverIO.uiStorage.getItem(key, cb);
  }

  removeItem(key) {
    this.serverIO.uiStorage.removeItem(key);
  }

  getAllKeys(cb) {
    this.serverIO.uiStorage.getAllKeys(cb);
  }
}


export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { initialized: false };
    this.serverIO = new ServerIO(store.dispatch);
  }

  componentWillMount() {
    const persistor = persistStore(store,
           { blacklist: ['remoteAccess', 'beamline', 'sampleChanger',
                         'form', 'login', 'general', 'logger'],
             storage: new ServerStorage(this.serverIO) },
             () => {
               store.dispatch(getLoginInfo());
               this.setState({ initialized: true });
             }
    );

    this.serverIO.listen(persistor);

    crosstabSync(persistor);
  }

  render() {
    if (! this.state.initialized) return <span>Loading...</span>;

    return (<Provider store={store}>
            <Router>
              <Route path="/" component={Main} onEnter={requireAuth}>
               <IndexRoute component={SampleGridContainer} />
               <Route path="datacollection" component={SampleViewContainer} />
               <Route path="sampleChanger" component={SampleChangerContainer} />
               <Route path="logging" component={LoggerContainer} />
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
