import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  signOut,
  selectProposal,
  sendSelectProposal,
  hideProposalsForm,
} from '../actions/login';
import { setLoading } from '../actions/general';
import SelectProposal from '../components/Login/SelectProposal';
import withRouter from '../components/WithRouter';

class SelectProposalContainer extends Component {
  render() {
    const show =
      (this.props.login.loginType === 'User' &&
        this.props.login.selectedProposalID === null) ||
      this.props.login.showProposalsForm;

    return (
      <SelectProposal
        show={show}
        handleHide={
          this.props.login.selectedProposalID === null
            ? () => this.props.signOut(this.props.router.navigate)
            : this.props.hideProposalsForm
        }
        data={this.props.login}
        selectProposal={this.props.selectProposal}
        sendSelectProposal={(selected) =>
          this.props.sendSelectProposal(selected, this.props.router.navigate)
        }
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    login: state.login,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    signOut: bindActionCreators(signOut, dispatch),
    setLoading: bindActionCreators(setLoading, dispatch),
    selectProposal: bindActionCreators(selectProposal, dispatch),
    sendSelectProposal: bindActionCreators(sendSelectProposal, dispatch),
    hideProposalsForm: bindActionCreators(hideProposalsForm, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(SelectProposalContainer));
