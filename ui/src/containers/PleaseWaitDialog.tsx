import { Button, Modal, ProgressBar } from 'react-bootstrap';

import { hideWaitDialog } from '../reducers/waitDialog';
import { useAppDispatch, useAppSelector } from '../ts-store';

function PleaseWaitDialog() {
  const dispatch = useAppDispatch();

  const { show, title, message, blocking, abortFun } = useAppSelector(
    (state) => state.waitDialog,
  );

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
            <p>{message || ''}</p>
            {blocking && <ProgressBar variant="primary" animated now={100} />}
          </div>
        </Modal.Body>
      )}
      <Modal.Footer>
        {blocking ? (
          <Button
            variant="outline-secondary"
            onClick={() => {
              if (abortFun) {
                abortFun();
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
