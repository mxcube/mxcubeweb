import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button, Panel } from 'react-bootstrap';
import { sendGiveControl } from '../../actions/remoteAccess';

class UserList extends React.Component {
  getObservers() {
    const observers = [];

    for (const observer of this.props.remoteAccess.observers) {
      observers.push((
        <div key={observer.username}>
          <div className="col-xs-4">
            <span style={{ lineHeight: '24px' }}>{observer.nickname}</span>
          </div>
          <div className="col-xs-4">
            <span style={{ lineHeight: '24px' }}>{observer.ip}</span>
          </div>
          { this.props.login.user.inControl ?
            (<div className="col-xs-4">
              <Button className="btn-sm" onClick={() => this.props.sendGiveControl(observer.username)}>
                 Give control
               </Button>
             </div>)
            :
            (<div className="col-xs-4"><span>&nbsp;</span></div>)
          }
        </div>
      ));
    }

    return observers;
  }

  render() {
    return (
      <Panel>
        <Panel.Heading>Users</Panel.Heading>
        <Panel.Body>
          <div className="col-xs-12">
            <div className="col-xs-4"><b>Name</b></div>
            <div className="col-xs-4"><b>Host</b></div>
            <div className="col-xs-4"><span>&nbsp;</span></div>
            {this.getObservers()}
          </div>
        </Panel.Body>
      </Panel>
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
