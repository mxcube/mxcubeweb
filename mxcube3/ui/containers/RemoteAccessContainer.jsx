import React from 'react';
import { connect } from 'react-redux';

import Observer from '../components/RemoteAccess/Observer';
import Master from '../components/RemoteAccess/Master';

export class RemoteAccessContainer extends React.Component {

  getContent() {
    let content = (<Master />);

    if (!this.props.remoteAccess.master) {
      content = (<Observer />);
    }

    return content;
  }

  render() {
    return (
      <div className="col-xs-12">
        {this.getContent()}
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess
  };
}

export default connect(
    mapStateToProps,
)(RemoteAccessContainer);
