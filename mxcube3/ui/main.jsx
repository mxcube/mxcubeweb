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
import io from "socket.io-client";

const store = configureStore({}); //samples_grid: {samples_list: samples_list}});

window.log_records = [];
window.log_records_connect = function() {
    //clearTimeout(window.log_records_keepalive);
    //window.log_records_keepalive = setTimeout(window.log_records_connect, 5*1000); 
    window.log_records_ws = io.connect('http://' + document.domain + ':' + location.port+"/logging");
    window.log_records_ws.on('log_record', (e) => {
        let record = JSON.parse(e.data);
        window.log_records.push(record);
        //clearTimeout(window.log_records_keepalive);
        //window.log_records_keepalive = setTimeout(window.log_records_connect, 30*1000);
        if (window.logging_component) { window.logging_component.handle_record(record) }
    })
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

