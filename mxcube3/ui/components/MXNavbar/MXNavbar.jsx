import React from 'react';
import { Navbar, NavBrand, Nav, NavItem } from 'react-bootstrap';


export default class MXNavbar extends React.Component {

  render() {
    let proposal = this.props.userInfo.Proposal;
    let propInfo = (this.props.loggedIn ? proposal.title + ' - ' + proposal.code : '');

    return (
      <Navbar inverse fluid fixedTop>
        <NavBrand>MXCuBE 3</NavBrand>
        <Nav navbar>
          <NavItem 
              eventKey={1} 
              active={this.props.location.pathname === '/'} 
              href="#/"
          >
            Samples
          </NavItem>
          <NavItem 
            eventKey={2}
            active={this.props.location.pathname === '/datacollection'}
            href="#/datacollection"
          >
            Data Collection
          </NavItem>
          <NavItem 
           eventKey={3}
           active={this.props.location.pathname === '/logging'}
           href="#/logging"
          >
            System log
          </NavItem>
        </Nav>
        <Nav right eventKey={0}>
          <p className="navbar-text" style={{ float: 'none', display: 'inline-block' }}>
            {propInfo}
          </p>
          <button 
            className="btn btn-sm btn-info" 
            style={{ marginRight: '15px' }}
            onClick={this.props.reset}
          >
            Reset
          </button>
          <a
           className="btn btn-sm btn-danger"
           style={{ marginRight: '15px' }}
           onClick={this.props.signOut}
           href="#/login"
          >
            Log out
          </a>
        </Nav>
      </Navbar>
    );
  }
}
