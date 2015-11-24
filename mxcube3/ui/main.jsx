import React from 'react';
import ReactDOM from 'react-dom';
import Login from './containers/LoginContainer';
import { Router, Route, Link } from 'react-router'
import SampleView from './SampleView/MainView'
import SampleGridMain from './samples'
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap";
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import login from './reducers/login';
require("file?name=[name].[ext]!index.html");

let store = createStore(login);

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
             <Navbar inverse fluid>
                  <NavBrand>MXCuBE 3</NavBrand>
                  <Nav navbar>
                      <NavItem eventKey={1} active={(this.state.active === 'samples') ? true : false} href="#/samplegrid">Samples</NavItem>
                      <NavItem eventKey={2} active={(this.state.active === 'dc') ? true : false} href="#/datacollection">Data Collection</NavItem>
                  </Nav>
                  <Login/>
              </Navbar>
              {this.props.children}
          </div>
       </Provider>)
    }
}

ReactDOM.render((
  <Router>
    <Route path="/" component={MXNavbar}>
      <Route path="samplegrid" component={SampleGridMain}/>
      <Route path="datacollection" component={SampleView}/>
    </Route>
  </Router>
), document.getElementById("main"));

