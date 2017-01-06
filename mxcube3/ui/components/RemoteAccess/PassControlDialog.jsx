import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import { Modal, Button, Input } from 'react-bootstrap';
import { requestControlResponse } from '../../actions/remoteAccess';

export class PassControlDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
    this.show = this.show.bind(this);
    this.getObserver = this.getObserver.bind(this);
  }

  onHide() { }

  getObserver() {
    let observer = { name: '', message: '', requestsControl: false };

    for (const o of this.props.remoteAccess.observers) {
      if (o.requestsControl) {
        observer = o;
        break;
      }
    }

    return observer;
  }

  show() {
    let show = false;

    if (this.props.remoteAccess.master) {
      if (this.getObserver().requestsControl) {
        show = true;
      }
    }

    return show;
  }

  accept() {
    const message = this.refs.message.refs.input.value;
    this.props.requestControlResponse(true, message);
  }

  reject() {
    const message = this.refs.message.refs.input.value;
    this.props.requestControlResponse(false, message);
  }

  render() {
    const observer = this.getObserver();

    return (
      <Modal
        show={this.show()}
        backdrop="static"
        onHide={this.onHide}
      >
        <Modal.Header>
          <Modal.Title>
            A user is asking for control
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          User {observer.name} is asking for control, message:
          <div style={ { marginLeft: '2em', marginTop: '1em', marginBottom: '1em' } }>
            "{observer.message}"
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Input
            ref="message"
            id="name"
            defaultValue="Here you go !"
            type="textarea"
            placeholder="Message"
            rows="3"
          />
          <Button onClick={this.accept}> Give control to {observer.name} </Button>
          <Button onClick={this.reject}> Deny control </Button>
        </Modal.Footer>
      </Modal>);
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
  };
}


function mapDispatchToProps(dispatch) {
  return {
    requestControlResponse: bindActionCreators(requestControlResponse, dispatch)
  };
}


export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PassControlDialog);
