import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link } from 'react-router'
import SampleView from './SampleView/MainView'
import SampleGridMain from './samples'
import LoginForm from 'Login';
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap";
import ErrorNotificationPanel from 'Logging';
require("file?name=[name].[ext]!index.html");

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
      <div>
      <Navbar inverse fluid>
        <NavBrand>MXCuBE 3</NavBrand>
        <Nav navbar>
          <NavItem eventKey={1} active={(this.state.active === 'samples') ? true : false} href="#/samplegrid">Samples</NavItem>
          <NavItem eventKey={2} active={(this.state.active === 'dc') ? true : false} href="#/datacollection">Data Collection</NavItem>
        </Nav>
        <LoginForm/>
      </Navbar>
      {this.props.children}
      </div>
      )
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

// var resolveRoute = function() {
//   // If no hash or hash is '#' we lazy load the SampleGrid component
//   if (!location.hash || location.hash.length === 1) {
//     require.ensure([], function () {
//       navbar.set_active('samples');
//       $('#samples').show();
//       $('#dc').hide();
//       require("samples"); 
//     });

//   // Or if route is #dc we lazy load that
//   } else if (location.hash === '#dc') {
//     require.ensure([], function () {
//       navbar.set_active('dc');
//       $('#dc').show();
//       $('#samples').hide();
//       require("./SampleView/MainView"); 
//     });
//   }
// };

// window.onhashchange = resolveRoute;

// resolveRoute();
