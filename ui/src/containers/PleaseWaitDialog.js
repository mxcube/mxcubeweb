/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, ProgressBar, Button } from 'react-bootstrap';
import { setLoading } from '../actions/general';

export class PleaseWaitDialog extends React.Component {
  constructor(props) {
    super(props);
    this.hide = this.hide.bind(this);
    this.abort = this.abort.bind(this);
  }

  hide() {
    this.props.setLoading(this.props.blocking);
  }

  abort() {
    if (this.props.abortFun) {
      this.props.abortFun();
    }

    this.props.setLoading(false);
  }

  render() {
    return (
      <Modal
        animation={false}
        show={this.props.loading}
        onHide={this.hide}
        data-default-styles
      >
        <Modal.Header closeButton={!this.props.blocking}>
          <Modal.Title>{this.props.title || 'Please wait'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <p>{this.props.message || ''}</p>
            {this.props.blocking && (
              <ProgressBar variant="primary" animated now={100} />
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          {this.props.blocking ? (
            <Button variant="outline-secondary" onClick={this.abort}>
              Cancel
            </Button>
          ) : (
            <Button variant="outline-secondary" onClick={this.hide}>
              Hide
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  }
}

function mapStateToProps(state) {
  return {
    loading: state.general.loading,
    title: state.general.title,
    message: state.general.message,
    blocking: state.general.blocking,
    abortFun: state.general.abortFun,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setLoading: bindActionCreators(setLoading, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PleaseWaitDialog);
