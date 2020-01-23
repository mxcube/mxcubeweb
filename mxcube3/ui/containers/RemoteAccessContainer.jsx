import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Panel, Checkbox } from 'react-bootstrap';

import RequestControlForm from '../components/RemoteAccess/RequestControlForm';
import UserList from '../components/RemoteAccess/UserList';

import { sendAllowRemote, sendTimeoutGivesControl } from '../actions/remoteAccess';

export class RemoteAccessContainer extends React.Component {
  getRAOptions() {
    const userType = this.props.remoteAccess.type;
    let content = (<div className="col-xs-2">
                     <Panel header="RA Options">
                       <Checkbox
                         onClick={(e) => this.props.sendAllowRemote(e.target.checked)}
                         defaultChecked={this.props.remoteAccess.allowRemote}
                         checked={this.props.remoteAccess.allowRemote}
                         disabled={userType !== 'local' && userType !== 'staff'}
                       >
                         Enable remote access
                       </Checkbox>
                       <Checkbox
                         onClick={(e) => this.props.sendTimeoutGivesControl(e.target.checked)}
                         defaultChecked={this.props.remoteAccess.timeoutGivesControl}
                         checked={this.props.remoteAccess.timeoutGivesControl}
                         disabled={userType !== 'local' && userType !== 'staff'}
                       >
                         Timeout gives control
                       </Checkbox>
                     </Panel>
                   </div>);


    const loginRes = this.props.login.loginInfo.loginRes;

    if (loginRes && loginRes.Session && !loginRes.Session.is_inhouse) {
      content = null;
    }

    return content;
  }

  render() {
    return (
      <div className="col-xs-12">
        { !this.props.remoteAccess.master ?
          (<div className="col-xs-3">
            <RequestControlForm />
           </div>) : null
        }
        <div className="col-xs-7">
          <UserList />
        </div>
        {this.getRAOptions()}
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
    sendAllowRemote: bindActionCreators(sendAllowRemote, dispatch),
    sendTimeoutGivesControl: bindActionCreators(sendTimeoutGivesControl, dispatch)
  };
}

export default connect(
   mapStateToProps,
   mapDispatchToProps
)(RemoteAccessContainer);
