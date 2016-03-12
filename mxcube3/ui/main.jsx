import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import SampleViewContainer from './containers/SampleViewContainer';
import SampleGridContainer from './containers/SampleGridContainer';
import LoginContainer from './containers/LoginContainer';
import { Logging } from './components/Logging';
import Main from './components/Main';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import './serverIO';
import "font-awesome-webpack";
require("file?name=[name].[ext]!index.html");

const store = configureStore({}); //samples_grid: {samples_list: samples_list}});

function requireAuth(nextState, replace){
    if (!store.getState().login.loggedIn) {
        replace(null, '/login');
    }
}

ReactDOM.render((
<Provider store={store}>
    <Router>
        <Route path="/" component={Main} onEnter={requireAuth}>
            <IndexRoute component={SampleGridContainer} onEnter={requireAuth}/>
            <Route path="datacollection" component={SampleViewContainer} onEnter={requireAuth}/>
            <Route path="logging" component={Logging} onEnter={requireAuth}/>
        </Route>
        <Route path="/login" component={LoginContainer} />
    </Router>
</Provider>
), document.getElementById("main"));