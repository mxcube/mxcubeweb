import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import logo from '../../img/mxcube_logo20.png';
import './MXNavbar.css';

export default class MXNavbar extends React.Component {

  render() {
    const proposal = this.props.userInfo.Proposal;
    const propInfo = (this.props.loggedIn ? `${proposal.title} - ${proposal.code}` : '');
    const sampleGrid = (
      <OverlayTrigger
        placement="right"
        overlay={(<Popover className="main-menu-tooltip">Sample Overview</Popover>)}
      >
        <p
          className="main-menu-icon text-center"
          eventKey={1}
          active={(this.props.location.pathname === '/')}
        >
          <a className="fa fa-2x fa-th-large icon" aria-hidden="true" href="#/"></a>
        </p>
      </OverlayTrigger>
    );

    document.title = `MxCuBE-3 ${propInfo}`;

    return (
      <div>
        <div className="main-menu text-center">
          <img src={logo} className="main-menu-logo" role="presentation" />
          <hr className="main-menu-breaker" />
          {(process.env.NODE_ENV !== 'production' ? sampleGrid : '')}
          <OverlayTrigger
            placement="right"
              overlay={(<Popover className="main-menu-tooltip">Data Collection</Popover>)}
          >
            <p
              className="main-menu-icon text-center"
              eventKey={1}
              active={(this.props.location.pathname === '/')}
            >
              <a
                className="fa fa-2x fa-crosshairs icon"
                aria-hidden="true"
                href="#/datacollection"
              >
              </a>
            </p>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            overlay={(<Popover className="main-menu-tooltip">System log</Popover>)}
          >
            <p
              className="main-menu-icon text-center"
              eventKey={1}
              active={(this.props.location.pathname === '/')}
              href="#/"
            >
              <a className="fa fa-2x fa-book icon" aria-hidden="true" href="#/logging"></a>
            </p>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            overlay={(<Popover className="main-menu-tooltip">Reset Session</Popover>)}
          >
            <p
              className="main-menu-icon text-center pull-down"
              eventKey={1}
              active={(this.props.location.pathname === '/')}
              href="#/"
            >
              <i
                className="fa fa-2x fa-trash-o icon"
                aria-hidden="true"
                onClick={this.props.reset}
              />
            </p>
          </OverlayTrigger>
          <OverlayTrigger
            placement="right"
            overlay={(<Popover className="main-menu-tooltip">Logout {proposal.title}</Popover>)}
          >
            <p
              className="main-menu-icon text-center main-menu-bottom-icon"
              eventKey={1}
              active={(this.props.location.pathname === '/')}
              href="#/"
            >
              <a
                className="fa fa-2x fa-sign-out icon"
                aria-hidden="true"
                onClick={this.props.signOut}
                href="#/login"
              >
              </a>
            </p>
          </OverlayTrigger>
        </div>
       </div>
    );
  }
}
