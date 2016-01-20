import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router';
import SampleViewContainer from './containers/SampleViewContainer';
import SampleGridContainer from './containers/SampleGridContainer';
import LoginContainer from './containers/LoginContainer';
import { Logging } from './components/Logging';
import Main from './components/Main';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import './serverIO';
require("file?name=[name].[ext]!index.html");

const store = configureStore({}); //samples_grid: {samples_list: samples_list}});

function requireAuth(nextState, replace) {
	console.log(store.getState().login.loggedIn);
  if (!store.getState().login.loggedIn) {
    replace(null, '/login');
  }
}

ReactDOM.render((
  <Provider store={store}>
	  <Router>
		  <Route path="/" component={Main} onEnter={requireAuth}>
			  <Route path="samplegrid" component={SampleGridContainer} />
			  <Route path="datacollection" component={SampleViewContainer}/>
        	  <Route path="logging" component={Logging}/>
		  </Route>
		  <Route path="/login" component={LoginContainer} />
	  </Router>
  </Provider>
), document.getElementById("main"));