import { Modal, ProgressBar, Button } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { hideWaitDialog } from '../actions/waitDialog';

function PleaseWaitDialog() {
  const dispatch = useDispatch();

  const { show, title, message, blocking, abortFun } = useSelector(
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
