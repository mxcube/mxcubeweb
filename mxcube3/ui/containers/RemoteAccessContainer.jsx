import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Panel, Checkbox } from 'react-bootstrap';

import RequestControlForm from '../components/RemoteAccess/RequestControlForm';
import UserList from '../components/RemoteAccess/UserList';

import { sendAllowRemote } from '../actions/remoteAccess';

export class RemoteAccessContainer extends React.Component {
  constructor(props) {
    super(props);
    this.enableRemoteAccessOnClick = this.enableRemoteAccessOnClick.bind(this);
  }

  getRAOptions() {
    let content = (<div className="col-xs-4">
                     <Panel header="RA Options">
                       <Checkbox
                         onClick={this.enableRemoteAccessOnClick}
                         defaultChecked={this.props.remoteAccess.allowRemote}
                       >
                         Enable remote access
                       </Checkbox>
                     </Panel>
                   </div>);

    if (!this.props.login.loginInfo.loginRes.Session.is_inhouse) {
      content = null;
    }

    return content;
  }

  enableRemoteAccessOnClick(e) {
    this.props.sendAllowRemote(e.target.checked);
  }

  render() {
    return (
      <div className="col-xs-12">
        { !this.props.remoteAccess.master ?
          (<div className="col-xs-4">
            <RequestControlForm />
           </div>) : null
        }
        <div className="col-xs-4">
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
    sendAllowRemote: bindActionCreators(sendAllowRemote, dispatch)
  };
}

export default connect(
   mapStateToProps,
   mapDispatchToProps
)(RemoteAccessContainer);
