import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { showForceLogoutDialog, doSignOut } from '../actions/login';

import { Modal, Button, Alert } from 'react-bootstrap';
import './ForceLogoutDialog.css';


export class ForceLogoutDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onOkClick = this.onOkClick.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  onOkClick() {
    this.props.hide();
    this.props.doSignOut();
  }

  handleCancel() {
    this.props.hide();
    this.props.doSignOut();
  }

  render() {
    return (
      <Modal
        backdrop="static"
        dialogClassName="modal-dialog-center"
        style="modal-warning"
        show={this.props.show}
        onHide={this.handleCancel}
      >
      <Alert bsStyle="danger">
          <strong>Error&nbsp;</strong>
      </Alert>
      <Modal.Body dialogClassName="modal-body-forceout">
        Mxcube server encountered a problem, logout will be forced.
        Contact beamline staff if the problem persists.
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={this.onOkClick}>Signout</Button>
      </Modal.Footer>
      </Modal>);
  }
}


function mapStateToProps(state) {
  return {
    show: state.login.showForceLogoutDialog,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(showForceLogoutDialog.bind(this, false), dispatch),
    doSignOut: bindActionCreators(doSignOut.bind(this), dispatch),
  };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ForceLogoutDialog);

