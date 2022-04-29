import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default class ConfirmActionDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onOkClick = this.onOkClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
  }

  onOkClick() {
    if (this.props.onOk) {
      this.props.onOk();
    }

    this.props.hide();
  }

  onCancelClick() {
    if (this.props.onCancel) {
      this.props.onCancel();
    }

    this.props.hide();
  }

  render() {
    return (
      <Modal show={this.props.show}>
        <Modal.Header>
          <Modal.Title>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.props.message}</Modal.Body>
        <Modal.Footer>
          <Button variant='outline-secondary' onClick={this.onCancelClick}>
            {this.props.cancelButtonText}
          </Button>
          <Button variant='outline-secondary' onClick={this.onOkClick}>{this.props.okButtonText}</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

ConfirmActionDialog.defaultProps = {
  show: false,
  title: '',
  message: '',
  okButtonText: 'Ok',
  cancelButtonText: 'Cancel',
  onOk: false,
  onCancel: false,
};
