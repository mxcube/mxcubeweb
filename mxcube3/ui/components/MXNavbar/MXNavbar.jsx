import React from 'react';
import { Navbar, NavBrand, Nav } from 'react-bootstrap';
import logo from '../../img/mxcube_logo20.png';
import './MXNavbar.css';

export default class MXNavbar extends React.Component {

  render() {
    const proposal = this.props.userInfo.Proposal;
    const propInfo = (this.props.loggedIn ? `${proposal.title} - ${proposal.code}` : '');
    const sampleGrid = (
      <p
        className="main-menu-icon text-center"
        eventKey={1}
        active={ (this.props.location.pathname === '/') }
      >
        <a className="fa fa-2x fa-th-large icon" aria-hidden="true" href="#/"></a>
      </p>
    );
    return (
      <div>
        <Navbar fluid fixedTop className="main-menu-top">
            <NavBrand>MXCuBE 3</NavBrand>
                <Nav right eventKey={0}>
                    <p
                      className="navbar-text"
                      style={{ float: 'none', display: 'inline-block' }}
                    >
                      {propInfo}
                    </p>
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
        <div className="main-menu text-center">
            <img src={logo} className="menu-logo" alt="logo" />
            <hr className="menu-breaker" />
            {(process.env.NODE_ENV !== 'production' ? sampleGrid : '')}
            <p className="main-menu-icon text-center" eventKey={1} active={ (this.props.location.pathname === '/') } >
                <a className="fa fa-2x fa-crosshairs icon" aria-hidden="true" href="#/datacollection"></a>
            </p>
            <p className="main-menu-icon text-center" eventKey={1} active={ (this.props.location.pathname === '/') } href="#/">
                <a className="fa fa-2x fa-book icon" aria-hidden="true" href="#/logging"></a>
            </p>
            <p className="main-menu-icon text-center pull-down" eventKey={1} active={ (this.props.location.pathname === '/') } href="#/">
                <i className="fa fa-2x fa-trash-o icon" aria-hidden="true" onClick={this.props.reset}></i>
            </p>
        </div>
    </div>
    );
  }
}
