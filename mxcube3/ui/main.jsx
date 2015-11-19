import React from 'react';
import ReactDOM from 'react-dom';
import LoginForm from 'Login';
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap";
import ErrorNotificationPanel from 'Logging';

class MXNavbar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { active: null };
    }

    set_active(name) {
        this.setState({ active: name });
    }

    render() {
      return (<Navbar inverse fluid>
        <NavBrand>MXCuBE 3</NavBrand>
        <Nav navbar>
          <NavItem eventKey={1} active={(this.state.active === 'samples') ? true : false} href="#">Samples</NavItem>
          <NavItem eventKey={2} active={(this.state.active === 'dc') ? true : false} href="#dc">Data collection</NavItem>
        </Nav>
        <LoginForm/>
      </Navbar>)
    }
}

window.error_notification = ReactDOM.render(<ErrorNotificationPanel/>, document.getElementById("error_notification_panel"));
let navbar = ReactDOM.render(<MXNavbar/>, document.getElementById("header"));

var resolveRoute = function() {
  // If no hash or hash is '#' we lazy load the SampleGrid component
  if (!location.hash || location.hash.length === 1) {
    require.ensure([], function () {
      navbar.set_active('samples');
      $('#samples').show();
      $('#dc').hide();
      require("samples"); 
    });

  // Or if route is #dc we lazy load that
  } else if (location.hash === '#dc') {
    require.ensure([], function () {
      navbar.set_active('dc');
      $('#dc').show();
      $('#samples').hide();
      require("./SampleView/MainView"); 
    });
  }
};

window.onhashchange = resolveRoute;

resolveRoute();
