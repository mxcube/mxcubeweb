import React from 'react';
import { Modal } from 'react-bootstrap';
import ModalDialog from 'react-bootstrap/lib/ModalDialog';
import Draggable from 'react-draggable';

class DraggableModalDialog extends React.Component {
  render() {
    return (
      <Draggable
        handle=".modal-header"
        defaultPosition={this.props.defaultPosition}
      >
        <ModalDialog {...this.props} />
      </Draggable>
    );
  }
}

export function DraggableModal(props) {
  return <Modal
    dialogComponentClass={DraggableModalDialog}
    enforceFocus={false}
    backdrop="static"
    {...props}
  >
    {props.children}
  </Modal>
}
