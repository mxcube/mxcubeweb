import React from 'react';
import { Navbar, Nav, NavItem, NavBrand } from 'react-bootstrap';

import './MXNavbar.css';

export default class MXNavbar extends React.Component {

  render() {
    const proposal = this.props.userInfo.Proposal;
    const propInfo = (this.props.loggedIn ? `${proposal.title} - ${proposal.code}` : '');
    const raStyle = (this.props.remoteAccessMaster ? { color: 'white' } : {});

    document.title = `MxCuBE-3 ${propInfo}`;

    return (
      <Navbar inverse>
        <NavBrand>
          MXCuBE 3
        </NavBrand>
        <Nav>
          <NavItem eventKey={1} href="#/">Sample Overview</NavItem>
          <NavItem eventKey={1} href="#/datacollection">Data collection</NavItem>
          <NavItem eventKey={1} href="#/sampleChanger">Sample Changer</NavItem>
          <NavItem eventKey={1} href="#/logging">System log</NavItem>
        </Nav>
        <Nav pullRight>
          <NavItem eventKey={1} onClick={this.props.reset} href="#">Reset session</NavItem>
          <NavItem eventKey={1} href="#/remoteaccess">
            <span style={ raStyle } className="fa fa-lg fa-universal-access" />
          </NavItem>
          <NavItem eventKey={1} onClick={this.props.signOut} href="#/login">
            <span className="fa fa-lg fa-sign-out" />
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}
