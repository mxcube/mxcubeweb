import React from 'react';
import { connect } from 'react-redux';
import MXNavbar from '../components/MXNavbar/MXNavbar';
import { doSignOut } from '../actions/login';

class MXNavbarContainer extends React.Component {
  render() {
    return (
      <MXNavbar
        user={this.props.user}
        selectedProposal={this.props.selectedProposal}
        signOut={this.props.signOut}
        loggedIn={this.props.loggedIn}
        location={this.props.location}
        setAutomatic={this.props.setAutomatic}
        remoteAccess={this.props.remoteAccess}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.login.user,
    loggedIn: state.login.loggedIn,
    selectedProposal: state.login.selectedProposal,
    mode: state.queue.automatic,
    remoteAccess: state.remoteAccess,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    signOut: () => dispatch(doSignOut()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MXNavbarContainer);
