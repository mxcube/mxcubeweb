import React from 'react';
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
import { serverIO } from '../serverIO';

function SelectProposalContainer(props) {
  function handleLogout() {
    props.signOut(props.router.navigate);
    serverIO.disconnect();
  }

  const show =
    (props.login.loginType === 'User' &&
      props.login.selectedProposalID === null) ||
    props.login.showProposalsForm;

  return (
    <SelectProposal
      show={show}
      handleHide={
        props.login.selectedProposalID === null
          ? () => handleLogout()
          : props.hideProposalsForm
      }
      data={props.login}
      selectProposal={props.selectProposal}
      sendSelectProposal={(selected) =>
        props.sendSelectProposal(selected, props.router.navigate)
      }
    />
  );
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
