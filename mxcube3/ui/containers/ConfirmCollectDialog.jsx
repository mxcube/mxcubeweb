import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Modal, Button, Table, OverlayTrigger, Popover } from 'react-bootstrap';
import { sendRunQueue } from '../actions/queue';
import { showConfirmCollectDialog } from '../actions/queueGUI';

import './ConfirmCollectDialog.css';


export class ConfirmCollectDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onOkClick = this.onOkClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
    this.collectionSummary = this.collectionSummary.bind(this);
    this.taskTable = this.taskTable.bind(this);
  }

  onOkClick() {
    this.props.sendRunQueue();
    this.props.hide();
  }

  onCancelClick() {
    this.props.hide();
  }

  collectionSummary() {
    const numSamples = this.props.queue.queue.length;
    const numTasks = Object.values(this.props.sampleGrid.sampleList).filter((sample) => (
      this.props.queue.queue.includes(sample.sampleID)
    )).map((sample) => sample.tasks.length).reduce((sum, value) => sum + value, 0);

    return { numSamples, numTasks };
  }

  taskTable() {
    const tasks = [].concat.apply([],
      Object.values(this.props.sampleGrid.sampleList).filter((sample) => (
        this.props.queue.queue.includes(sample.sampleID)
      )).map((sample) => sample.tasks));

    const table = (
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>Type</th>
            <th>Sample</th>
            <th>Path</th>
            <th>Prefix</th>
            <th># Images</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <OverlayTrigger
              bsClass="collect-confirm-dialog-overlay-trigger"
              placement="bottom"
              overlay={(
              <Popover id="collect-confirm-dialog-popover" bsClass="blabl">
                <Table striped bordered condensed hover>
                  <thead>
                    <tr>
                      <th>Osc. start</th>
                      <th>Osc. range</th>
                      <th>Exp time</th>
                      <th>Resolution</th>
                      <th>Transmission</th>
                      <th>Energy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{task.parameters.osc_start}</td>
                      <td>{task.parameters.osc_range}</td>
                      <td>{task.parameters.os}</td>
                      <td>{task.parameters.resolution}</td>
                      <td>{task.parameters.transmission}</td>
                      <td>{task.parameters.energy}</td>
                    </tr>
                  </tbody>
                </Table>
              </Popover>)}
            >
            <tr>
              <td>{task.label}</td>
              <td>{task.sampleID}</td>
              <td>{task.parameters.path}</td>
              <td>{task.parameters.prefix}</td>
              <td>{task.parameters.num_images}</td>
            </tr>
          </OverlayTrigger>))}
        </tbody>
      </Table>
    );

    return table;
  }

  render() {
    const summary = this.collectionSummary();
    return (
      <Modal
        dialogClassName="collect-confirm-dialog"
        show={this.props.show}
      >
        <Modal.Header>
          <Modal.Title>
            Collect queue ?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <b>{`Collecting ${summary.numTasks} tasks on ${summary.numSamples} samples`}</b>
          </p>
          {this.taskTable()}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onCancelClick}>Cancel</Button>
          <Button onClick={this.onOkClick}>Go Collect !</Button>
        </Modal.Footer>
      </Modal>);
  }
}

function mapStateToProps(state) {
  return {
    show: state.queueGUI.showConfirmCollectDialog,
    queue: state.queue,
    sampleGrid: state.sampleGrid
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(showConfirmCollectDialog.bind(this, false), dispatch),
    sendRunQueue: bindActionCreators(sendRunQueue, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfirmCollectDialog);
