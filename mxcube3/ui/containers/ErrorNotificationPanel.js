import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Alert } from 'react-bootstrap';
import { showErrorPanel } from '../actions/general';

export class ErrorNotificationPanel extends React.Component {
  render() {
    return (
      <Modal show={this.props.show} bsStyle="danger" onHide={this.props.hideErrorPanel}>
        <div style={{ marginBottom: '-20px' }}>
          <Alert bsStyle="danger">
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
    message: state.general.errorMessage
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideErrorPanel: bindActionCreators(showErrorPanel.bind(this, false), dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ErrorNotificationPanel);
