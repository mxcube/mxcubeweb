import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button } from 'react-bootstrap';
import { showConnectionLostDialog } from '../actions/general';

export class ConnectionLostDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
    this.intervalCb = this.intervalCb.bind(this);
    this.seconds = 60;
    this.timerid = undefined;
  }

  intervalCb() {
    this.seconds--;

    if (this.refs.countdown) {
      this.refs.countdown.innerHTML = this.seconds;
    }

    if (this.seconds < 1) {
      this.seconds = 0;
      this.accept();
    }
  }

  accept() {
    this.forceUpdate();
  }

  reject() {
    this.props.hide();
  }

  render() {
    this.seconds = 60;

    if (this.timerid) {
      clearInterval(this.timerid);
    }

    this.timerid = setInterval(this.intervalCb, 1000);
    setTimeout(() => { clearInterval(this.timerid); }, this.seconds * 1000);

    return (
      <Modal
        show={this.props.show}
        onHide={this.props.hide}
      >
        <Modal.Header>
          <Modal.Title>
          Connection lost
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Ooops ! There seems to be a problem with the internet connection,
          the connection to the server was lost. Trying to reconnect in <span ref="countdown">
          {this.seconds}</span> s
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.accept}> Try again </Button>
        </Modal.Footer>
      </Modal>);
  }
}

function mapStateToProps(state) {
  return {
    show: state.general.showConnectionLostDialog,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(showConnectionLostDialog.bind(this, false), dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectionLostDialog);
