import 'babel-core/polyfill'
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router'
import SampleViewContainer from './containers/SampleViewContainer'
import SampleGridContainer from './containers/SampleGridContainer'
import Main from './components/Main'
import { Provider } from 'react-redux';
import configureStore from './store/configureStore'
require("file?name=[name].[ext]!index.html");

const store = configureStore({}); //samples_grid: {samples_list: samples_list}});

ReactDOM.render((
  <Provider store={store}>
	  <Router>
		  <Route path="/" component={Main}>
			  <Route path="samplegrid" component={SampleGridContainer}/>
			  <Route path="datacollection" component={SampleViewContainer}/>
		  </Route>
	  </Router>
  </Provider>
), document.getElementById("main"));

