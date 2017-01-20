import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import { Modal, Button } from 'react-bootstrap';
import { showResumeQueueDialog } from '../actions/queueGUI';

export class ResumeQueueDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
  }

  accept() {
    this.props.hide();
  }

  reject() {
    this.props.hide();
  }

  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.hide}
      >
        <Modal.Header>
          <Modal.Title>
            Resume Queue
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Ooops ! The application was closed or there was problems with the
          connection while the queue was running. Just press Run Queue
          (found above the queue) if you like to continue execution.
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.reject}> OK </Button>
        </Modal.Footer>
      </Modal>);
  }
}

function mapStateToProps(state) {
  return {
    show: state.queue.showResumeQueueDialog,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(showResumeQueueDialog.bind(this, false), dispatch),
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ResumeQueueDialog);
