import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  logIn,
  signOut,
  selectProposal,
  sendSelectProposal,
  hideProposalsForm,
} from '../actions/login';
import { setLoading } from '../actions/general';
import Login from '../components/Login/Login';

class LoginContainer extends Component {
  render() {
    return <Login {...this.props} />;
  }
}

function mapStateToProps(state) {
  return {
    loading: state.general.loading,
    showError: state.general.showErrorPanel,
    errorMessage: state.general.errorMessage,
    showProposalsForm: state.login.showProposalsForm,
    data: state.login,
    selectedProposal: state.login.selectedProposal,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    logIn: bindActionCreators(logIn, dispatch),
    signOut: bindActionCreators(signOut, dispatch),
    setLoading: bindActionCreators(setLoading, dispatch),
    selectProposal: bindActionCreators(selectProposal, dispatch),
    sendSelectProposal: bindActionCreators(sendSelectProposal, dispatch),
    hideProposalsForm: bindActionCreators(hideProposalsForm, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginContainer);
