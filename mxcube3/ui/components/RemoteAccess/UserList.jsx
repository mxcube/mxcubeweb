import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button, Panel, ButtonToolbar, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { sendGiveControl } from '../../actions/remoteAccess';
import { sendForceUserSignOut } from '../../actions/login';

class UserList extends React.Component {
  getUserInfo() {
    const isMaster = this.props.remoteAccess.master;
    return (
      <div>
        <div className="col-xs-2">
          <span style={{ lineHeight: '36px' }}>{this.props.login.loginID} (you)</span>
        </div>
        <div className="col-xs-4">
          <span style={{ lineHeight: '36px' }}>{this.props.login.host}</span>
        </div>
        <div className="col-xs-2">
          <span style={{ lineHeight: '36px' }}>{this.props.remoteAccess.type}</span>
        </div>
        <div className="col-xs-2">
          <span style={{ lineHeight: '36px' }}>{isMaster ? 'Master' : 'Observer'}</span>
        </div>
        <div className="col-xs-2">
          <span style={{ lineHeight: '36px' }}>{isMaster ? 'In control' : 'No control'}</span>
        </div>
      </div>
    );
  }

  getUsers() {
    const users = [];
    if (this.props.remoteAccess.users) {
      for (const user of this.props.remoteAccess.users) {
        user.loginID !== this.props.login.loginID ?
          users.push((
            <div>
              <div className="col-xs-2">
                <span style={{ lineHeight: '24px' }}>{user.loginID}</span>
              </div>
              <div className="col-xs-4">
                <span style={{ lineHeight: '24px' }}>{user.host}</span>
              </div>
              <div className="col-xs-2">
                <span style={{ lineHeight: '24px' }}>{user.type}</span>
              </div>
              <div className="col-xs-2">
                <span style={{ lineHeight: '24px' }}>{user.operator ? 'Master' : 'Observer'}</span>
              </div>
              <div className="col-xs-2">
                <ButtonToolbar>
                    <OverlayTrigger
                      placement="top"
                      trigger="hover"
                      overlay={
                        <Tooltip>
                          Give control to user
                        </Tooltip>
                      }
                    >
                    <Button
                      className="btn-sm"
                      data-toggle="tooltip"
                      data-placement="top" title="Give control"
                      disabled={!this.props.remoteAccess.master}
                      onClick={() => this.props.sendGiveControl(user.sid)}
                    >
                    <span className="fa fa-lg fa-gamepad" />
                    </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      trigger="hover"
                      overlay={
                        <Tooltip>
                          Force signout
                        </Tooltip>
                      }
                    >
                    <Button
                      className="btn-sm"
                      data-toggle="tooltip"
                      data-placement="top" title="Tooltip on top"
                      disabled={this.props.remoteAccess.type !== 'staff'}
                      onClick={() => this.props.sendForceUserSignOut(user.sid)}
                    >
                    <span className="fa fa-lg fa-sign-out" />
                    </Button>
                    </OverlayTrigger>
                </ButtonToolbar>
              </div>
            </div>
          )) : null;
      }
    }
    return users;
  }

  render() {
    return (
      <div>
      <Panel header="User Info">
        <div className="col-xs-12">
          <div className="col-xs-2"><b>Name</b></div>
          <div className="col-xs-4"><b>Host</b></div>
          <div className="col-xs-2"><b>Type</b></div>
          <div className="col-xs-2"><b>Role</b></div>
          <div className="col-xs-2"><b>Control</b></div>
          {this.getUserInfo()}
          {this.getUsers()}
        </div>
      </Panel>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
    login: state.login
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendGiveControl: bindActionCreators(sendGiveControl, dispatch),
    sendForceUserSignOut: bindActionCreators(sendForceUserSignOut, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserList);
