/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
  runSample,
  setAutoMountSample,
  setCentringMethod,
  setNumSnapshots,
  startQueue,
} from '../actions/queue';
import { showConfirmCollectDialog } from '../actions/queueGUI';
import TaskTable from '../components/ConfirmCollectDialog/TaskTable.jsx';
import {
  AUTO_LOOP_CENTRING,
  CLICK_CENTRING,
  TASK_UNCOLLECTED,
} from '../constants';
import NumSnapshotsDropDown from './NumSnapshotsDropDown.jsx';

export class ConfirmCollectDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onOkClick = this.onOkClick.bind(this);
    this.onCancelClick = this.onCancelClick.bind(this);
    this.collectionSummary = this.collectionSummary.bind(this);
    this.autoLoopCentringOnClick = this.autoLoopCentringOnClick.bind(this);
    this.autoMountNextOnClick = this.autoMountNextOnClick.bind(this);
    this.collectText = this.collectText.bind(this);
    this.tasksToCollect = this.tasksToCollect.bind(this);
    this.setNumSnapshots = this.setNumSnapshots.bind(this);
  }

  onOkClick() {
    const sample =
      this.props.queue.currentSampleID || this.props.queue.queue[0];
    this.props.startQueue(this.props.queue.autoMountNext, sample);
    this.props.hide();
  }

  onCancelClick() {
    this.props.hide();
  }

  setNumSnapshots(n) {
    this.props.setNumSnapshots(n);
  }

  autoLoopCentringOnClick(e) {
    if (e.target.checked) {
      this.props.setCentringMethod(AUTO_LOOP_CENTRING);
    } else {
      this.props.setCentringMethod(CLICK_CENTRING);
    }
  }

  autoMountNextOnClick(e) {
    this.props.setAutoMountSample(e.target.checked);
  }

  /**
   * Returns tasks to collect
   *
   * @property {Object} sampleGrid
   * @property {Object} queue
   * @return {Array} {tasks}
   */
  tasksToCollect() {
    // Flat array of all tasks
    let { queue } = this.props.queue;

    // Making the dialog a bit more intuitive, only display the tasks for the
    // sample to be colleted when autoMountNtext is false
    if (!this.props.queue.autoMountNext) {
      const sampleID =
        this.props.queue.currentSampleID || this.props.queue.queue[0];

      if (sampleID) {
        queue = [sampleID];
      }
    }

    const tasks = Object.values(queue)
      .map((sampleID) => this.props.sampleGrid.sampleList[sampleID] || {})
      .flatMap((sample) => sample.tasks || {});

    return tasks.filter((task) => task.state === TASK_UNCOLLECTED);
  }

  /**
   * Returns collection summary, total number of samples and tasks in the queue
   *
   * @property {Object} sampleGrid
   * @property {Object} queue
   * @return {Object} {numSaples, numTasks}
   */
  collectionSummary() {
    let numSamples = this.props.queue.queue.length;
    const numTasks = this.tasksToCollect().length;

    if (
      !this.props.queue.autoMountNext &&
      (this.props.queue.currentSampleID || this.props.queue.queue[0])
    ) {
      numSamples = 1;
    }

    return { numSamples, numTasks };
  }

  collectText() {
    const summary = this.collectionSummary();
    let text = `Collecting ${summary.numTasks} tasks on ${summary.numSamples} samples`;

    if (summary.numTasks === 0) {
      text = `Collecting ${summary.numSamples} samples`;
    }

    if (!this.props.queue.autoMountNext && this.props.queue.queue.length > 1) {
      text += ', NOT auto mounting next sample';
    }

    return text;
  }

  render() {
    const autoMountNext = this.props.queue.queue.length > 1;
    return (
      <Modal show={this.props.show}>
        <Modal.Header>
          <Modal.Title>Collect Queue ?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <b>{this.collectText()}</b>
          </p>
          <div>
            <span>
              <Form.Check
                className="mb-2"
                type="checkbox"
                defaultChecked={
                  this.props.queue.centringMethod === AUTO_LOOP_CENTRING
                }
                onClick={this.autoLoopCentringOnClick}
                id="auto-lopp-centring"
                label="Auto loop centring"
              />
              {autoMountNext ? (
                <Form.Check
                  className="mb-2"
                  type="checkbox"
                  id="auto-mount-next"
                  defaultChecked={this.props.queue.autoMountNext}
                  onClick={this.autoMountNextOnClick}
                  label="Auto mount next sample"
                />
              ) : (
                <span />
              )}
              <NumSnapshotsDropDown align="start" />
            </span>
          </div>

          <br />
          <p style={{ color: '#337ab7' }}>
            <b>Data Root: {this.props.login.rootPath}</b>
          </p>
          <TaskTable tasks={this.tasksToCollect()} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={this.onCancelClick}>
            Cancel
          </Button>
          <Button variant="success" onClick={this.onOkClick}>
            Collect
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

function mapStateToProps(state) {
  return {
    show: state.queueGUI.showConfirmCollectDialog,
    queue: state.queue,
    sampleGrid: state.sampleGrid,
    login: state.login,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hide: bindActionCreators(
      showConfirmCollectDialog.bind(null, false),
      dispatch,
    ),
    startQueue: bindActionCreators(startQueue, dispatch),
    runSample: bindActionCreators(runSample, dispatch),
    setAutoMountSample: bindActionCreators(setAutoMountSample, dispatch),
    setCentringMethod: bindActionCreators(setCentringMethod, dispatch),
    setNumSnapshots: bindActionCreators(setNumSnapshots, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmCollectDialog);
