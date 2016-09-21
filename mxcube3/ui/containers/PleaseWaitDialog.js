import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, ProgressBar, Button } from 'react-bootstrap';
import { setLoading } from '../actions/general';

export default class PleaseWaitDialog extends React.Component {

  getTitle() {
    return this.props.title || 'Please wait';
  }

  getMessage() {
    return this.props.message || '';
  }

  hide() {
    let fun = this.props.setLoadingFalse;

    if (this.props.blocking) {
      fun = this.props.setLoadingTrue;
    }

    return fun;
  }

  renderHeader() {
    let header = (
      <Modal.Header closeButton>
        <Modal.Title>{this.getTitle()}</Modal.Title>
      </Modal.Header>
    );

    if (this.props.blocking) {
      header = (
        <Modal.Header>
          <Modal.Title>{this.getTitle()}</Modal.Title>
        </Modal.Header>
      );
    }

    return header;
  }

  renderFooter() {
    let footer = (
      <Modal.Footer>
      </Modal.Footer>
    );

    if (this.props.blocking) {
      footer = (
        <Modal.Footer>
          <Button>Abort</Button>
        </Modal.Footer>
      );
    }

    return footer;
  }

  render() {
    return (
      <Modal animation={false} show={this.props.loading} onHide={this.hide}>
        {this.renderHeader()}
        <Modal.Body closeButton>
          <p>
            {this.getMessage()}
          </p>
          <ProgressBar active now={100} />
        </Modal.Body>
        {this.renderFooter()}
      </Modal>
    );
  }
}


function mapStateToProps(state) {
  return {
    loading: state.general.loading,
    title: state.general.title,
    message: state.general.message,
    blocking: state.general.blocking
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setLoadingFalse: bindActionCreators(setLoading.bind(this, false), dispatch),
    setLoadingTrue: bindActionCreators(setLoading.bind(this, true), dispatch)
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PleaseWaitDialog);
