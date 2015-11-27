import 'babel-core/polyfill'
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router'
import Login from './containers/LoginContainer';
import SampleViewContainer from './containers/SampleViewContainer'
import SampleQueueContainer from './containers/SampleQueueContainer'
import SampleGridMain from './samples'
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap";
import { Provider } from 'react-redux';
import ErrorNotificationPanel from 'Logging';
import configureStore from './store/configureStore'
require("file?name=[name].[ext]!index.html");



const store = configureStore()

class MXNavbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { active: null };
    }

    set_active(name) {
        this.setState({ active: name });
    }

    render() {
      return (
        <Provider store={store}>
          <div>
             <ErrorNotificationPanel/>
             <Navbar inverse fluid>
                  <NavBrand>MXCuBE 3</NavBrand>
                  <Nav navbar>
                      <NavItem eventKey={1} active={(this.state.active === 'samples') ? true : false} href="#/samplegrid">Samples</NavItem>
                      <NavItem eventKey={2} active={(this.state.active === 'dc') ? true : false} href="#/sampleview">Data Collection</NavItem>
                  </Nav>
                  <Login/>
              </Navbar>
              <div className="container-fluid">
                <div className="row">
                  <div className="col-xs-2">
                  <SampleQueueContainer />
                  </div>
                  <div className="col-xs-10">
                  {this.props.children}
                  </div>
                </div>
              </div>
          </div>
       </Provider>)
    }
}

ReactDOM.render((
  <Router>
    <Route path="/" component={MXNavbar}>
      <Route path="samplegrid" component={SampleGridMain}/>
      <Route path="sampleview" component={SampleViewContainer}/>
    </Route>
  </Router>
), document.getElementById("main"));

