import { useCallback } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { showDialog } from '../../actions/general';
import styles from './dataCollectionResult.module.css';
import { DataCollectionResultSummary } from './DataCollectionResultSummary';

export function DataCollectionResultDialog() {
  const dispatch = useDispatch();

  const taskData = useSelector((state) => state.general?.dialogData || {});
  const show = useSelector(
    (state) => state.general?.dialogType === 'LIMS_RESULT_DIALOG',
  );

  const handleHideDialog = useCallback(() => {
    dispatch(showDialog(false));
  }, [dispatch]);

  if (!show) {
    return null;
  }

  return (
    <Modal
      dialogClassName={styles.dc_result_dialog}
      show={show}
      onHide={handleHideDialog}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          Result summary : {taskData?.label || 'Untitled Collection'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <DataCollectionResultSummary />
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleHideDialog}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
