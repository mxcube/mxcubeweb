/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Alert } from 'react-bootstrap';
import { showErrorPanel } from '../actions/general';

export class ErrorNotificationPanel extends React.Component {
  render() {
    return (
      <Modal show={this.props.show} onHide={this.props.hideErrorPanel}>
        <div style={{ marginBottom: '-20px' }}>
          <Alert
            variant="danger"
            onClose={this.props.hideErrorPanel}
            dismissible
          >
            <strong>Error:&nbsp;</strong>
            {this.props.message}
          </Alert>
        </div>
      </Modal>
    );
  }
}

function mapStateToProps(state) {
  return {
    show: state.general.showErrorPanel,
    message: state.general.errorMessage,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideErrorPanel: bindActionCreators(
      showErrorPanel.bind(null, false),
      dispatch,
    ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ErrorNotificationPanel);
