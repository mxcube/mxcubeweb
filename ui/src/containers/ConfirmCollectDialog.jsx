import './ConfirmCollectDialog.css';

import React from 'react';
import {
  Button,
  Form,
  Modal,
  OverlayTrigger,
  Popover,
  Table,
} from 'react-bootstrap';
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
    this.taskTable = this.taskTable.bind(this);
    this.onResize = this.onResize.bind(this);
    this.resizeTable = this.resizeTable.bind(this);
    this.autoLoopCentringOnClick = this.autoLoopCentringOnClick.bind(this);
    this.autoMountNextOnClick = this.autoMountNextOnClick.bind(this);
    this.collectText = this.collectText.bind(this);
    this.tasksToCollect = this.tasksToCollect.bind(this);
    this.setNumSnapshots = this.setNumSnapshots.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize, false);
    this.resizeTable();
  }

  componentDidUpdate() {
    this.resizeTable();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
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

  onResize() {
    this.resizeTable();
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
   * The CSS that adds the scroll bar changes the way the table rows are displayed
   * so we need to recalculate the width of the header and body rows so that they
   * are aligned properly
   */
  resizeTable() {
    const tableHead = document.querySelector('#table-head');
    const tableBody = document.querySelector('#table-body');

    if (tableHead && tableBody) {
      const headerColWidthArray = [...tableHead.children[0].children].map(
        (td) => td.getBoundingClientRect().width,
      );

      const bodyColWidthArray = [...tableBody.children[0].children].map(
        (td) => td.getBoundingClientRect().width,
      );

      // Set the width of each collumn in the body to be atleast the width of the
      // corresponding collumn in the header
      [...tableBody.children].map((tr) =>
        [...tr.children].forEach((td, i) => {
          const _td = td;
          _td.width = headerColWidthArray[i];
        }),
      );

      // Update the header columns so that they match the content of the body
      [...tableHead.children[0].children].forEach((th, i) => {
        if (bodyColWidthArray[i] > th.getBoundingClientRect().width) {
          const _th = th;
          _th.width = bodyColWidthArray[i];
        }
      });
    }
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

  taskPopover(task) {
    let pover = <span />;

    if (task.type === 'energy_scan') {
      pover = (
        <Popover id="collect-confirm-dialog-popover">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Element</th>
                <th>Edge</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{task.parameters.element}</td>
                <td>{task.parameters.edge}</td>
              </tr>
            </tbody>
          </Table>
        </Popover>
      );
    } else if (task.type === 'xrf_spectrum') {
      pover = (
        <Popover id="collect-confirm-dialog-popover">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Integration Time (s)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{task.parameters.exp_time}</td>
              </tr>
            </tbody>
          </Table>
        </Popover>
      );
    } else {
      pover = (
        <Popover id="collect-confirm-dialog-popover">
          <Table striped bordered hover>
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
                <td>{task.parameters.exp_time}</td>
                <td>{task.parameters.resolution}</td>
                <td>{task.parameters.transmission}</td>
                <td>{task.parameters.energy}</td>
              </tr>
            </tbody>
          </Table>
        </Popover>
      );
    }

    return pover;
  }

  /**
   * Returns the markup for a table containing summary/details for each task
   * in the queue
   *
   * @property {Object} sampleGrid
   * @property {Object} queue
   * @return {ReactDomNode} Table Markup
   */
  taskTable() {
    const tasks = this.tasksToCollect();
    const summary = this.collectionSummary();
    let table = (
      <div
        style={{
          marginBottom: '1em',
          borderRadius: '5px',
          backgroundColor: 'rgba(247, 211, 35, 0.27)',
          padding: '1em',
          width: 'auto',
        }}
      >
        No tasks added to any of the samples, you have the possibility to add
        tasks while the queue is running. <br />
        The queue is executed sample by sample and will wait until
        <b> Mount Next Sample </b> is pressed before mounting the next sample{' '}
        <br />
      </div>
    );

    if (summary.numTasks > 0) {
      table = (
        <div className="scroll">
          <Table responsive striped bordered hover>
            <thead id="table-head">
              <tr>
                <th>Type</th>
                <th>Sample</th>
                <th>Path</th>
                <th># Images</th>
              </tr>
            </thead>
            <tbody id="table-body">
              {tasks.map((task) => {
                let { parameters } = task;
                const sample = this.props.sampleGrid.sampleList[task.sampleID];
                const sampleName = `${sample.sampleName} - ${sample.proteinAcronym}`;

                if (task.type === 'Interleaved') {
                  parameters = task.parameters.wedges[0].parameters;
                }

                return (
                  <OverlayTrigger
                    key={task.queueID}
                    bsClass="collect-confirm-dialog-overlay-trigger"
                    placement="bottom"
                    overlay={this.taskPopover(task)}
                  >
                    <tr id={task.queueID}>
                      <td>{task.label}</td>
                      <td>
                        {sampleName} ({sample.location})
                      </td>
                      <td>
                        <b style={{ color: '#337ab7' }}>
                          ...
                          {parameters.fullPath.split(this.props.login.rootPath)}
                        </b>
                      </td>
                      <td>{parameters.num_images || '-'}</td>
                    </tr>
                  </OverlayTrigger>
                );
              })}
            </tbody>
          </Table>
        </div>
      );
    }

    return table;
  }

  render() {
    const autoMountNext = this.props.queue.queue.length > 1;
    return (
      <Modal dialogClassName="collect-confirm-dialog" show={this.props.show}>
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
          {this.taskTable()}
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
