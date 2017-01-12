import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import 'bootstrap-webpack!bootstrap-webpack/bootstrap.config.js';
import { Modal, Button, Input } from 'react-bootstrap';
import { showObserverDialog, setMaster } from '../../actions/remoteAccess';

export class ObserverDialog extends React.Component {
  constructor(props) {
    super(props);
    this.accept = this.accept.bind(this);
    this.reject = this.reject.bind(this);
    this.show = this.show.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.remoteAccess.master && !nextProps.remoteAccess.master) {
      this.lostControl = true;
    } else {
      this.lostControl = false;
    }
  }

  onHide() { }

  show() {
    return !this.props.remoteAccess.observerName && !this.props.remoteAccess.master;
  }

  accept() {
    const name = this.refs.name.refs.input.value;

    if (name) {
      this.props.setMaster(false, name);
    }
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
          <Input
            ref="name"
            id="name"
            type="text"
            placeholder="Your name"
          />
          <Button onClick={this.accept}> OK </Button>
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
    hide: bindActionCreators(showObserverDialog.bind(this, false), dispatch),
    setMaster: bindActionCreators(setMaster, dispatch),
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ObserverDialog);
