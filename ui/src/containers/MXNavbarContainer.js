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
        doSignOut={this.props.doSignOut}
        loggedIn={this.props.loggedIn}
        location={this.props.location}
        setAutomatic={this.props.setAutomatic}
        remoteAccess={this.props.remoteAccess}
        mode={this.props.mode}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.login.user,
    loggedIn: state.login.loggedIn,
    selectedProposal: state.login.selectedProposal,
    mode: state.general.mode,
    remoteAccess: state.remoteAccess,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    doSignOut: (navigate) => dispatch(doSignOut(navigate)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MXNavbarContainer);
