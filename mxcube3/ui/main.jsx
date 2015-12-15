import 'babel-core/polyfill'
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router'
import SampleViewContainer from './containers/SampleViewContainer'
import SampleGridContainer from './containers/SampleGridContainer'
import { Logging } from './components/Logging'
import Main from './components/Main'
import { Provider } from 'react-redux';
import configureStore from './store/configureStore'
require("file?name=[name].[ext]!index.html");

const store = configureStore({}); //samples_grid: {samples_list: samples_list}});

window.log_records = [];
window.log_records_connect = function() {
    clearTimeout(window.log_records_keepalive);
    window.log_records_keepalive = setTimeout(window.log_records_connect, 5*1000); 
    window.log_records_source = new EventSource('mxcube/api/v0.1/logging_stream');
    window.log_records_source.addEventListener('message', function(e) {
        window.log_records.push(JSON.parse(e.data));
        clearTimeout(window.log_records_keepalive);
        window.log_records_keepalive = setTimeout(window.log_records_connect, 30*1000);
    }, false);
};
window.log_records_connect();

ReactDOM.render((
  <Provider store={store}>
	  <Router>
		  <Route path="/" component={Main}>
			  <Route path="samplegrid" component={SampleGridContainer}/>
			  <Route path="datacollection" component={SampleViewContainer}/>
                          <Route path="logging" component={Logging}/>
		  </Route>
	  </Router>
  </Provider>
), document.getElementById("main"));

