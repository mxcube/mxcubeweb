import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Form } from 'react-bootstrap';
import { showObserverDialog, sendUpdateNickname } from '../../actions/remoteAccess';

export class ObserverDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
    this.show = this.show.bind(this);
  }

  componentDidUpdate() {
    if (this.name && this.name.value === '') {
      try {
        this.name.value = this.props.login.user.nickname;
      } catch (err) {
        this.name.value = '';
      }
    }
  }

  onHide() { }

  show() {
    return !this.props.login.user.inControl && this.props.login.user.nickname === '';
  }

  accept() {
    const name = this.name.value;

    if (name) {
      this.props.sendUpdateNickname(name);
    } else {
      this.props.sendUpdateNickname(this.props.login.user.username);
    }

    this.props.hide();
  }

  reject() {
    this.props.hide();
  }

  title() {
    return 'Observer mode';
  }

  render() {
    return (
      <Modal
        backdrop="static"
        show={this.show()}
        onHide={this.onHide}
        style={{ zIndex: 10001 }}
      >
        <Modal.Header>
          <Modal.Title>
            {this.title()}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Someone else is currently using the beamline, you are going to be
          logged in as an observer. You have to enter your name to be able to
          continue.
        </Modal.Body>
        <Modal.Footer>
          <Form.Control
            ref={(ref) => { this.name = ref; }}
            type="text"
            default={this.props.login.selectedProposal}
          />
          <Button onClick={this.accept}> OK </Button>
        </Modal.Footer>
      </Modal>);
  }
}

function mapStateToProps(state) {
  return {
    remoteAccess: state.remoteAccess,
    login: state.login
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(showObserverDialog.bind(this, false), dispatch),
    sendUpdateNickname: bindActionCreators(sendUpdateNickname, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ObserverDialog);
