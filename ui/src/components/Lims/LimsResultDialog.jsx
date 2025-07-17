/* eslint-disable react/destructuring-assignment */
import './LimsResultDialog.css';

import React from 'react';
import { Button, Modal } from 'react-bootstrap';

import { LimsResultSummary } from './LimsResultSummary';

export class LimsResultDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onHide = this.onHide.bind(this);
  }

  onHide() {
    this.props.onHide();
  }

  render() {
    return (
      <Modal
        dialogClassName="lims-result-dialog"
        show={this.props.show}
        onHide={this.onHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>Result summary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.taskData ? (
            <LimsResultSummary taskData={this.props.taskData} />
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
