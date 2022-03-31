import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { Link } from "react-router-dom";
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

    document.title = `MxCuBE-3 Proposal: ${this.props.selectedProposal}`;

    return (
      <Navbar style={{ padding: '0px'}} bg="dark" variant="dark" fixed="top" collapseOnSelect expand="lg">
        <Container fluid>
          <Link className="nav-link" to="/remoteaccess">
            <Navbar.Brand>
              MXCuBE3 <span className="brand-subtitle">{`(${this.props.selectedProposal} collecting)`}</span>
            </Navbar.Brand>
          </Link>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto" style={{ marginLeft: '20em' }}>
              <Link className="nav-link" to="/samplegrid">Samples</Link>
              <Link className="nav-link" to="/datacollection">Data collection</Link>
              <Link className="nav-link" to="/samplechanger">SC tools</Link>
              <Link className="nav-link" to="/logging">System log</Link>
            </Nav>
            <Nav>
              <Link className="nav-link" to="/help">
                <span className="fas fa-lg fa-question-circle" /> Help
              </Link>
              <Link className="nav-link" to="/remoteaccess">
                <span style={ raStyle } className="fas fa-lg fa-globe">
                  {numObservers > 0 ? <span className="badge-num">{numObservers}</span> : null }
                </span> Remote
              </Link>
              <Button as={Nav.Link} className="nav-link" variant="Light" onClick={this.signOut}>
                <span className="fas fa-lg fa-sign-out-alt" />
                Sign out
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