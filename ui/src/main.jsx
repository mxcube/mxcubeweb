import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-table/css/react-bootstrap-table.css';
import './main.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, browserHistory, IndexRoute } from 'react-router';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';
import { persistStore } from 'redux-persist';
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

// Logger MUST BE the last middleware
const middleware = [thunk, createLogger()];

const composedEnhancers = compose(applyMiddleware(...middleware));

const store = createStore(rootReducer, composedEnhancers);

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

function requireAuth(nextState, replace, callback) {
  let state = store.getState();
  store.dispatch(getLoginInfo()).then(() => {
    state = store.getState();
    if (!state.login.loggedIn) {
      replace('/login');
    } else {
      const persistor = persistStore(
        store,
        {
          blacklist: [
            'remoteAccess',
            'beamline',
            'sampleChanger',
            'form',
            'login',
            'general',
            'logger',
            'shapes',
            'sampleView',
            'taskResult',
            'sampleChangerMaintenance',
            'uiproperties',
          ],
          storage: new ServerStorage(),
        },
        () => {
           
          // this.setState({ initialized: true });
          /* eslint-enable react/no-set-state */
        }
      );

      serverIO.connectStateSocket(persistor);
      // crosstabSync(persistor);

      serverIO.listen(store);
      store.dispatch(startSession());
    }
    return callback();
  });
}

export default class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = { initialized: false };
  }

  componentWillMount() {
    serverIO.connectNetworkSocket(() => {
       
      this.setState({ initialized: true });
      /* eslint-enable react/no-set-state */
    });
  }

  render() {
    if (!this.state.initialized) {
      return (
        <div id="loading">
          <img className="logo" src={logo} role="presentation" />
          <div>
            <h3>Loading, please wait</h3>{' '}
            <img
              className="loader-init"
              src={loadingAnimation}
              role="presentation"
            />
          </div>
        </div>
      );
    }

    return (
      <Provider store={store}>
        <Router history={browserHistory}>
          <Route path="/login" component={LoginContainer} />
          <Route path="/" component={Main} onEnter={requireAuth}>
            <IndexRoute component={SampleViewContainer} />
            <Route path="samplegrid" component={SampleGridViewContainer} />
            <Route path="datacollection" component={SampleViewContainer} />
            <Route path="samplechanger" component={SampleChangerContainer} />
            <Route path="logging" component={LoggerContainer} />
            <Route path="remoteaccess" component={RemoteAccessContainer} />
            <Route path="help" component={HelpContainer} />
          </Route>
        </Router>
      </Provider>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('#main'));
