import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button, Panel } from 'react-bootstrap';
import { sendGiveControl } from '../../actions/remoteAccess';

class UserList extends React.Component {
  getUserInfo() {
    const isMaster = this.props.remoteAccess.master;
    return (
      <div>
        <div className="col-xs-3">
          <span style={{ lineHeight: '24px' }}>{this.props.login.loginID}</span>
        </div>
        <div className="col-xs-3">
          <span style={{ lineHeight: '24px' }}>{this.props.login.host}</span>
        </div>
        <div className="col-xs-2">
          <span style={{ lineHeight: '24px' }}>{this.props.remoteAccess.type}</span>
        </div>
        <div className="col-xs-4">
          <span style={{ lineHeight: '24px' }}>{isMaster ? 'You are in control' :
            'You are not in control'}</span>
        </div>
      </div>
    );
  }

  getObservers() {
    const observers = [];
    for (const observer of this.props.remoteAccess.observers) {
      observers.push((
        <div>
          <div className="col-xs-3">
            <span style={{ lineHeight: '24px' }}>{observer.name}</span>
          </div>
          <div className="col-xs-3">
            <span style={{ lineHeight: '24px' }}>{observer.host}</span>
          </div>
          <div className="col-xs-2">
            <span style={{ lineHeight: '24px' }}>{observer.type}</span>
          </div>
          <div className="col-xs-4">
            <Button className="btn-sm"
              disabled={!this.props.remoteAccess.master}
              onClick={() => this.props.sendGiveControl(observer.sid)}
            >
            Give control
            </Button>
          </div>
        </div>
      ));
    }

    return observers;
  }

  render() {
    return (
      <div>
      <Panel header="User Info">
        <div className="col-xs-12">
          <div className="col-xs-3"><b>Name</b></div>
          <div className="col-xs-3"><b>Host</b></div>
          <div className="col-xs-2"><b>Type</b></div>
          <div className="col-xs-4"><span>&nbsp;</span></div>
          {this.getUserInfo()}
        </div>
      </Panel>
      { this.props.remoteAccess.observers.length > 0 ?
        (<Panel header="Observers">
        <div className="col-xs-12">
          <div className="col-xs-3"><b>Name</b></div>
          <div className="col-xs-3"><b>Host</b></div>
          <div className="col-xs-2"><b>Type</b></div>
          <div className="col-xs-4"><span>&nbsp;</span></div>
          {this.getObservers()}
        </div>
      </Panel>) : null
      }
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
    sendGiveControl: bindActionCreators(sendGiveControl, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserList);
