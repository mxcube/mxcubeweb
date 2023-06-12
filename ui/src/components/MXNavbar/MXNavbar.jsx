import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import withRouter from '../WithRouter';
import './MXNavbar.css';

class MXNavbar extends React.Component {
  constructor(props) {
    super(props);
    this.findProposal = this.findProposal.bind(this);
    this.signOut = this.signOut.bind(this);
  }

  findProposal(prop) {
    return `${prop.Proposal.code}${prop.Proposal.number}` === this.props.selectedProposal;
  }

  signOut(){
    this.props.signOut();
    this.props.router.navigate('/login' , { replace: true });
  }

  render() {
    const raStyle = (this.props.user.inControl ? { color: 'white' } : {});
    const numObservers = this.props.remoteAccess.observers.length;

    document.title = `MxCuBE-Web Proposal: ${this.props.selectedProposal}`;

    return (
      <Navbar className='pt-1 pb-1' bg="dark" variant="dark" collapseOnSelect expand="lg">
        <Container fluid>
          <LinkContainer to="/remoteaccess">
            <Navbar.Brand>
              MXCuBE-Web <span className="brand-subtitle">({this.props.mode})</span>
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="m-auto">
              <LinkContainer className="me-4" to="/samplegrid"><Nav.Link>
                Samples</Nav.Link>
              </LinkContainer>
              <LinkContainer className="me-4"to="/datacollection">
                <Nav.Link>Data collection</Nav.Link>
              </LinkContainer>
              <LinkContainer className="me-4" to="/equipment">
                <Nav.Link>Equipment</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/logging">
                <Nav.Link>System log</Nav.Link>
              </LinkContainer>
            </Nav>
            <Nav>
              <LinkContainer className="me-2" to="/help">
                <Nav.Link>
                  <span className="me-1 fas fa-lg fa-question-circle" />
                  Help
                </Nav.Link>
              </LinkContainer>
              <LinkContainer className="me-2" to="/remoteaccess">
                <Nav.Link>
                  <span style={ raStyle } className="me-1 fas fa-lg fa-globe">
                    {numObservers > 0 ? <span className="badge-num">{numObservers}</span> : null }
                  </span>
                  Remote
                </Nav.Link>
              </LinkContainer>
              <Button as={Nav.Link} className="pe-0" variant="Light" onClick={this.signOut}>
                <span className="me-1 fas fa-lg fa-sign-out-alt" />
                Sign out {`(${this.props.selectedProposal})`}
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }
}
MXNavbar = withRouter(MXNavbar);
export default MXNavbar;
