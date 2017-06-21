import React from 'react';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import './MXNavbar.css';


export default class MXNavbar extends React.Component {

  constructor(props) {
    super(props);
    this.findProposal = this.findProposal.bind(this);
  }

  findProposal(prop) {
    let resp = false;
    // the next lines for the mismatch between mockups and real ispyb
    if (prop.hasOwnProperty('Proposal')) {
      resp = prop.Proposal.number === this.props.selectedProposal;
    } else if (prop.hasOwnProperty('number')) {
      resp = prop.number === this.props.selectedProposal;
    }
    return resp;
  }

  render() {
    let propInfo = '';
    const proposal = this.props.userInfo.ProposalList ?
        this.props.userInfo.ProposalList.find(this.findProposal) : '';
    // the next lines for the mismatch between mockups and real ispyb
    if (proposal.hasOwnProperty('Proposal')) {
      propInfo = (this.props.loggedIn && this.props.selectedProposal ?
        `Proposal: ${proposal.Proposal.number}` : '');
    } else if (proposal.hasOwnProperty('number')) {
      propInfo = (this.props.loggedIn && this.props.selectedProposal ?
        `Proposal: ${proposal.number}` : '');
    }
    const raStyle = (this.props.remoteAccessMaster ? { color: 'white' } : {});

    document.title = `MxCuBE-3 ${propInfo}`;

    return (
      <Navbar inverse fixedTop fluid>
        <Navbar.Header>
          <Navbar.Brand>
            MXCuBE 3
          </Navbar.Brand>
        </Navbar.Header>
        <Nav style={{ marginLeft: '20em' }}>
          <LinkContainer to="/samplegrid">
            <NavItem eventKey={1}>Sample Overview</NavItem>
          </LinkContainer>
          <LinkContainer to="/datacollection">
            <NavItem eventKey={2}>Data collection</NavItem>
          </LinkContainer>
          <LinkContainer to="/samplechanger">
            <NavItem eventKey={3}>Sample Changer</NavItem>
          </LinkContainer>
          <LinkContainer to="/logging">
            <NavItem eventKey={4}>System log</NavItem>
          </LinkContainer>
        </Nav>
        <Nav pullRight>
          <LinkContainer to="/remoteaccess">
            <NavItem eventKey={6}>
              <span style={ raStyle } className="fa fa-lg fa-universal-access" />
            </NavItem>
          </LinkContainer>
          <NavItem eventKey={7} onClick={this.props.signOut}>
            <span className="fa fa-lg fa-sign-out" />
          </NavItem>
        </Nav>
      </Navbar>
    );
  }
}

