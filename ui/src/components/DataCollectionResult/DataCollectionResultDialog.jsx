/* eslint-disable react/destructuring-assignment */

import React from 'react';
import { Button, Modal } from 'react-bootstrap';

import styles from './dataCollectionResult.module.css';
import { DataCollectionResultSummary } from './DataCollectionResultSummary';

export class DataCollectionResultDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onHide = this.onHide.bind(this);
  }
      dialogClassName={styles.dc_result_dialog}
  onHide() {
    this.props.onHide();
  }

  render() {
    return (
      <Modal
        dialogClassName="dc-result-dialog"
        show={this.props.show}
        onHide={this.onHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>Result summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.taskData ? (
            <DataCollectionResultSummary taskData={this.props.taskData} />
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
