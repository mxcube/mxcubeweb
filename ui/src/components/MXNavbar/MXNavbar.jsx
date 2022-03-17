import React from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

import withRouter from '../WithRouter';
import './MXNavbar.css';

class MXNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.findProposal = this.findProposal.bind(this);
  }

  findProposal(prop) {
    return (
      `${prop.Proposal.code}${prop.Proposal.number}` ===
      this.props.selectedProposal
    );
  }

  signOut(){
    this.props.signOut();
    this.props.router.navigate('/login' , { replace: true });
  }

  render() {
    const raStyle = this.props.user.inControl ? { color: 'white' } : {};
    const numObservers = this.props.remoteAccess.observers.length;

    document.title = `MxCuBE-3 Proposal: ${this.props.selectedProposal}`;

    return (
      <Navbar inverse fixedTop fluid>
        <Navbar.Header>
          <LinkContainer to="/remoteaccess">
            <Navbar.Brand>
              MXCuBE3{' '}
              <span className="brand-subtitle">{`(${this.props.selectedProposal} collecting)`}</span>
            </Navbar.Brand>
          </LinkContainer>
        </Navbar.Header>
        <Nav style={{ marginLeft: '20em' }}>
          <LinkContainer to="/samplegrid">
            <NavItem eventKey={1}>Samples</NavItem>
          </LinkContainer>
          <LinkContainer to="/datacollection">
            <NavItem eventKey={2}>Data collection</NavItem>
          </LinkContainer>
          <LinkContainer to="/samplechanger">
            <NavItem eventKey={3}>SC tools</NavItem>
          </LinkContainer>
          <LinkContainer to="/logging">
            <NavItem eventKey={4}>System log</NavItem>
          </LinkContainer>
        </Nav>
        <Nav pullRight>
          <LinkContainer to="/help">
            <NavItem eventKey={5}>
              <span className="fas fa-lg fa-question-circle" /> Help
            </NavItem>
          </LinkContainer>
          <LinkContainer to="/remoteaccess">
            <NavItem eventKey={6}>
              <span style={raStyle} className="fas fa-lg fa-globe">
                {numObservers > 0 ? (
                  <span className="badge-num">{numObservers}</span>
                ) : null}
              </span>{' '}
              Remote
            </NavItem>
          </LinkContainer>
          <NavItem eventKey={7} onClick={this.props.signOut}>
            <span className="fas fa-lg fa-sign-out" /> Sign out
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

MXNavbar = withRouter(MXNavbar);
export default MXNavbar;