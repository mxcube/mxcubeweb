import { Button, Modal } from 'react-bootstrap';

import styles from './dataCollectionResult.module.css';
import { DataCollectionResultSummary } from './DataCollectionResultSummary';

export function DataCollectionResultDialog(props) {
  const { show, onHide, taskData } = props;

  return (
    <Modal
      dialogClassName={styles.dc_result_dialog}
      show={show}
      onHide={onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>Result summary : {taskData?.label}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {taskData && <DataCollectionResultSummary taskData={taskData} />}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
