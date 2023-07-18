import React from 'react';
import { Modal } from 'react-bootstrap';
import Draggable from 'react-draggable';

class DraggableModalDialog extends React.Component {
  render() {
    return (
      <Draggable handle=".modal-header" defaultPosition={this.props.defaultpos}>
        <Modal.Dialog {...this.props} />
      </Draggable>
    );
  }
}

export function DraggableModal(props) {
  return (
    <Modal
      dialogAs={DraggableModalDialog}
      enforceFocus={false}
      backdrop="static"
      {...props}
    >
      {props.children}
    </Modal>
  );
}
