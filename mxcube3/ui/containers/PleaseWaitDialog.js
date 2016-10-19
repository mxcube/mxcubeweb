import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, ProgressBar, Button } from 'react-bootstrap';
import { setLoading } from '../actions/general';

export class PleaseWaitDialog extends React.Component {

  constructor(props) {
    super(props);
    this.getHideFun = this.getHideFun.bind(this);
    this.abort = this.abort.bind(this);
  }

  getTitle() {
    return this.props.title || 'Please wait';
  }

  getMessage() {
    return this.props.message || '';
  }

  getHideFun() {
    let fun = this.props.setLoadingFalse;

    if (this.props.blocking) {
      fun = this.props.setLoadingTrue;
    }

    return fun;
  }

  abort() {
    if (this.props.abortFun) {
      this.props.abortFun();
    }

    this.getHideFun()();
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
	<Button onClick={this.getHideFun()}>OK</Button>
      </Modal.Footer>
    );

    if (this.props.blocking) {
      footer = (
        <Modal.Footer>
          <Button onClick={this.abort}>Abort</Button>
        </Modal.Footer>
      );
    }

    return footer;
  }

  renderContent() {
    let content = (
      <div>
        <p>
          {this.getMessage()}
        </p>
      </div>);

    if (this.props.blocking) {
      content = (
        <div>
          <p>
            {this.getMessage()}
          </p>
          <ProgressBar active now={100} />
	</div>);
    }

    return content;
  }

  render() {
    return (
      <Modal ref="modal" animation={false} show={this.props.loading} onHide={this.getHideFun}>
        {this.renderHeader()}
        <Modal.Body closeButton>
          {this.renderContent()}
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
    blocking: state.general.blocking,
    abortFun: state.general.abortFun
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
