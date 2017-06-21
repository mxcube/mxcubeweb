import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { signIn, selectProposal, sendSelectProposal, hideProposalsForm } from '../actions/login';
import { setLoading } from '../actions/general';
import Login from '../components/Login/Login';


class LoginContainer extends Component {
  render() {
    return (
      <Login
        {...this.props}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    loading: state.general.loading,
    showError: state.general.showErrorPanel,
    showForm: state.login.showForm,
    data: state.login.data,
    selectedProposal: state.login.selectedProposal
  };
}

function mapDispatchToProps(dispatch) {
  return {
    signIn: bindActionCreators(signIn, dispatch),
    setLoading: bindActionCreators(setLoading, dispatch),
    selectProposal: bindActionCreators(selectProposal, dispatch),
    sendSelectProposal: bindActionCreators(sendSelectProposal, dispatch),
    hideProposalsForm: bindActionCreators(hideProposalsForm, dispatch)
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginContainer);
