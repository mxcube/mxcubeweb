import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute } from 'react-router';
import SampleViewContainer from './containers/SampleViewContainer';
import SampleGridContainer from './containers/SampleGridContainer';
import LoginContainer from './containers/LoginContainer';
import LoggerContainer from './containers/LoggerContainer';
import Main from './components/Main';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import ServerIO from './serverIO';
import "font-awesome-webpack";
require("file?name=[name].[ext]!index.html");


const store = configureStore({}); //samples_grid: {samples_list: samples_list}});

function requireAuth(nextState, replace){
    if (!store.getState().login.loggedIn) {
        replace(null, '/login');
    }
}

const serverIO = new ServerIO(store.dispatch);
serverIO.listen();


ReactDOM.render((
<Provider store={store}>
    <Router>
        <Route path="/" component={Main} onEnter={requireAuth}>
            <IndexRoute component={SampleGridContainer} onEnter={requireAuth}/>
            <Route path="datacollection" component={SampleViewContainer} onEnter={requireAuth}/>
            <Route path="logging" component={LoggerContainer} onEnter={requireAuth}/>
        </Route>
        <Route path="/login" component={LoginContainer} />
    </Router>
</Provider>
), document.getElementById("main"));