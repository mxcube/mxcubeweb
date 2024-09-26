import React from 'react';
import { Modal } from 'react-bootstrap';
import Draggable from 'react-draggable';

function DraggableModalDialog(props) {
  const { defaultpos } = props;

  return (
    <Draggable handle=".modal-header" defaultPosition={defaultpos}>
      <Modal.Dialog {...props} />
    </Draggable>
  );
}

export function DraggableModal(props) {
  const { children } = props;

  return (
    <Modal
      dialogAs={DraggableModalDialog}
      enforceFocus={false}
      backdrop="static"
      {...props}
    >
      {children}
    </Modal>
  );
}
