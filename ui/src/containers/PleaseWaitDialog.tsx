import { Button, Modal, ProgressBar } from 'react-bootstrap';

import { stopQueue } from '../actions/queue';
import { cancelControlRequest } from '../actions/remoteAccess';
import {
  hideWaitDialog,
  type WaitDialogAbortAction,
} from '../reducers/waitDialog';
import { useAppDispatch, useAppSelector } from '../ts-store';

// Set of well-known abort actions that can be triggered from the wait dialog.
const ABORT_ACTIONS: Record<WaitDialogAbortAction, () => () => void> = {
  cancelControlRequest,
  stopQueue,
};

function PleaseWaitDialog() {
  const dispatch = useAppDispatch();

  const { show, dialog } = useAppSelector((state) => state.waitDialog);

  if (dialog === null) {
    return null;
  }

  const { blocking, message, abortAction, title } = dialog;
  return (
    <Modal
      keyboard={!blocking}
      backdrop={!blocking || 'static'}
      show={show}
      onHide={() => dispatch(hideWaitDialog())}
      data-default-styles
    >
      <Modal.Header closeButton={!blocking}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      {(message || blocking) && (
        <Modal.Body>
          <div>
            <p>{message}</p>
            {blocking && <ProgressBar variant="primary" animated now={100} />}
          </div>
        </Modal.Body>
      )}
      <Modal.Footer>
        {blocking ? (
          <Button
            variant="outline-secondary"
            onClick={() => {
              if (abortAction) {
                dispatch(ABORT_ACTIONS[abortAction]());
              }
              dispatch(hideWaitDialog());
            }}
          >
            Cancel
          </Button>
        ) : (
          <Button
            variant="outline-secondary"
            onClick={() => dispatch(hideWaitDialog())}
          >
            Hide
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default PleaseWaitDialog;
