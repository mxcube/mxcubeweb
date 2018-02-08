import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Modal,
         Button,
         Table,
         OverlayTrigger,
         Popover,
         Checkbox } from 'react-bootstrap';

import { sendRunQueue,
         sendRunSample,
         sendMountSample,
         setAutoMountSample,
         sendSetCentringMethod,
         sendSetNumSnapshots } from '../actions/queue';

import NumSnapshotsDropDown from './NumSnapshotsDropDown.jsx';
import { showConfirmCollectDialog } from '../actions/queueGUI';
import { TASK_UNCOLLECTED, AUTO_LOOP_CENTRING, CLICK_CENTRING } from '../constants';

import './ConfirmCollectDialog.css';


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
    this.onHide = this.onHide.bind(this);
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
    const sample = this.props.queue.current.sampleID || this.props.queue.queue[0];
    this.props.sendRunQueue(this.props.queue.autoMountNext, sample);
    this.props.hide();
  }

  onCancelClick() {
    this.props.hide();
  }

  onResize() {
    this.resizeTable();
  }

  onHide() { }

  setNumSnapshots(n) {
    this.props.sendSetNumSnapshots(n);
  }

  autoLoopCentringOnClick(e) {
    if (e.target.checked) {
      this.props.sendSetCentringMethod(AUTO_LOOP_CENTRING);
    } else {
      this.props.sendSetCentringMethod(CLICK_CENTRING);
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
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    if (tableHead && tableBody) {
      const headerColWidthArray = Array.map(tableHead.children[0].children, (td) => (
        td.getBoundingClientRect().width));

      const bodyColWidthArray = Array.map(tableBody.children[0].children, (td) => (
        td.getBoundingClientRect().width));

      // Set the width of each collumn in the body to be atleast the width of the
      // corresponding collumn in the header
      Array.map(tableBody.children, (tr) => Array.forEach(tr.children, (td, i) => {
        const _td = td;
        _td.width = headerColWidthArray[i];
      }));

      // Update the header columns so that they match the content of the body
      Array.forEach(tableHead.children[0].children, (th, i) => {
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
    let queue = this.props.queue.queue;

    // Making the dialog a bit more intuitive, only display the tasks for the
    // sample to be colleted when autoMountNtext is false
    if (!this.props.queue.autoMountNext) {
      const sampleID = this.props.queue.current.sampleID ?
              this.props.queue.current.sampleID : this.props.queue.queue[0];

      if (sampleID) {
        queue = [sampleID];
      }
    }

    const tasks = [].concat.apply([],
      Object.values(queue).map((sampleID) => (
        this.props.sampleGrid.sampleList[sampleID]
      )).map((sample) => sample.tasks));

    return tasks.filter((task) => (task.state === TASK_UNCOLLECTED));
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

    if (!this.props.queue.autoMountNext &&
        (this.props.queue.current.sampleID || this.props.queue.queue[0])) {
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
    let pover = (<span></span>);

    if (task.type === 'EnergyScan') {
      pover = (
        <Popover id="collect-confirm-dialog-popover">
          <Table striped bordered condensed hover>
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
        </Popover>);
    } else if (task.type === 'XRFScan') {
      pover = (
        <Popover id="collect-confirm-dialog-popover">
          <Table striped bordered condensed hover>
            <thead>
              <tr>
                <th>Integration Time (s)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{task.parameters.countTime}</td>
              </tr>
            </tbody>
          </Table>
        </Popover>);
    } else {
      pover = (
        <Popover id="collect-confirm-dialog-popover">
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
                <td>{task.parameters.exp_time}</td>
                <td>{task.parameters.resolution}</td>
                <td>{task.parameters.transmission}</td>
                <td>{task.parameters.energy}</td>
              </tr>
            </tbody>
          </Table>
        </Popover>);
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
      <div style={{ marginBottom: '1em', borderRadius: '5px',
                    backgroundColor: 'rgba(247, 211, 35, 0.27)',
                    padding: '1em', width: '50em'
           }}
      >
        No tasks added to any of the samples, you have the
        possibility to add tasks while the queue is running. <br />
        The queue is executed sample by sample and will wait until
        <b> Mount Next Sample </b> is pressed before mounting the
        next sample <br />
      </div>);

    if (summary.numTasks > 0) {
      table = (
        <div className="scroll">
        <Table striped bordered hover condensed>
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
              let parameters = task.parameters;
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
                  <td>{sampleName} ({sample.location})</td>
                    <td>
                      <b style={{ color: '#337ab7' }} >
                        ...{parameters.fullPath.split(this.props.queue.rootPath)}
                      </b>
                    </td>
                    <td>{parameters.num_images || '-'}</td>
                  </tr>
                </OverlayTrigger>
             );})}
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
      <Modal
        dialogClassName="collect-confirm-dialog"
        show={this.props.show}
        onHide={this.onHide}
      >
        <Modal.Header>
          <Modal.Title>
            Collect Queue ?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <b>{this.collectText()}</b>
          </p>
          <div>
            <span>
              <Checkbox
                defaultChecked={this.props.queue.centringMethod === AUTO_LOOP_CENTRING}
                onClick={this.autoLoopCentringOnClick}
              >
                Auto loop centring
              </Checkbox>
              { autoMountNext ?
                  <Checkbox
                    defaultChecked={this.props.queue.autoMountNext}
                    onClick={this.autoMountNextOnClick}
                  >
                    Auto mount next sample
                  </Checkbox>
                : <span />
              }
              <NumSnapshotsDropDown />
            </span>
          </div>

          <br />
          <p style={{ color: '#337ab7' }}>
            <b>Data Root: {this.props.queue.rootPath}</b>
          </p>
          {this.taskTable()}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onCancelClick}>Cancel</Button>
          <Button onClick={this.onOkClick}>Collect</Button>
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
    sendRunQueue: bindActionCreators(sendRunQueue, dispatch),
    sendRunSample: bindActionCreators(sendRunSample, dispatch),
    sendMountSample: bindActionCreators(sendMountSample, dispatch),
    setAutoMountSample: bindActionCreators(setAutoMountSample, dispatch),
    sendSetCentringMethod: bindActionCreators(sendSetCentringMethod, dispatch),
    sendSetNumSnapshots: bindActionCreators(sendSetNumSnapshots, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfirmCollectDialog);
