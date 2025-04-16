/* eslint-disable react/destructuring-assignment */
import './LimsResultDialog.css';

import React from 'react';
import { Button, Modal } from 'react-bootstrap';

import { TASK_COLLECTED } from '../../constants';
import { LimsResultSummary } from './LimsResultSummary';

export class LimsResultDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onHide = this.onHide.bind(this);
    this.getResultLink = this.getResultLink.bind(this);
  }

  onHide() {
    this.props.onHide();
  }

  getResultLink() {
    if (this.props.taskData.state !== TASK_COLLECTED) {
      return <span />;
    }

    const link = this.props.taskData.limsResultData
      ? this.props.taskData.limsResultData.limsTaskLink
      : '';

    return (
      <div style={{ margin: '1em' }}>
        <a href={link} target="_blank" rel="noreferrer">
          View results in ISPyB
        </a>
      </div>
    );
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
            <>
              <LimsResultSummary taskData={this.props.taskData} />
              {this.getResultLink()}
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
