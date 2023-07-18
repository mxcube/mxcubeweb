import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Form } from 'react-bootstrap';
import { requestControlResponse } from '../../actions/remoteAccess';

export class PassControlDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
    this.show = this.show.bind(this);
    this.getObserver = this.getObserver.bind(this);
  }

  onHide() {}

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

    if (this.props.login.user.inControl && this.getObserver().requestsControl) {
      show = true;
    }

    return show;
  }

  accept() {
    const message = this.message.value;
    this.props.requestControlResponse(true, message);
  }

  reject() {
    const message = this.message.value;
    this.props.requestControlResponse(false, message);
  }

  render() {
    const observer = this.getObserver();

    return (
      <Modal
        show={this.show()}
        backdrop="static"
        onHide={this.onHide}
        style={{ zIndex: 10_001 }}
      >
        <Modal.Header>
          <Modal.Title>{observer.nickname} is asking for control</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          User "{observer.nickname}" is asking for control:
        </Modal.Body>
        <Modal.Footer>
          <Form.Control
            ref={(ref) => {
              this.message = ref;
            }}
            defaultValue="Here you go !"
            type="textarea"
            placeholder="Message"
            rows="3"
          />
          <br />
          <Button size="sm" variant="outline-secondary" onClick={this.accept}>
            {' '}
            Give control to "{observer.nickname}"{' '}
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={this.reject}>
            {' '}
            Deny control{' '}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
    login: state.login,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    requestControlResponse: bindActionCreators(
      requestControlResponse,
      dispatch,
    ),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PassControlDialog);
