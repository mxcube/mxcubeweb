import { Button, Modal } from 'react-bootstrap';

import { showResumeQueueDialog } from '../reducers/queueGUI';
import { useAppDispatch, useAppSelector } from '../ts-store';

function ResumeQueueDialog() {
  const dispatch = useAppDispatch();
  const show = useAppSelector((state) => state.queueGUI.showResumeQueueDialog);

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
