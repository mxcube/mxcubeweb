import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import { showResumeQueueDialog } from '../actions/queueGUI';

function ResumeQueueDialog() {
  const dispatch = useDispatch();
  const show = useSelector((state) => state.queueGUI.showResumeQueueDialog);

  return (
    <Modal
      show={show}
      onHide={() => dispatch(showResumeQueueDialog(false))}
      data-default-styles
    >
      <Modal.Header>
        <Modal.Title>Resume Queue</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Ooops! The application was closed or there were connection problems
        while the queue was running. Dismiss this dialog then press{' '}
        <em>Run Queue</em> again to resume execution.
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={() => dispatch(showResumeQueueDialog(false))}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ResumeQueueDialog;
