import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Modal, Button, Table, OverlayTrigger, Popover, Checkbox } from 'react-bootstrap';
import { sendRunQueue, sendRunSample, sendMountSample, setAutoMountSample } from '../actions/queue';
import { showConfirmCollectDialog } from '../actions/queueGUI';
import { TASK_UNCOLLECTED } from '../constants';

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
    this.onHide = this.onHide.bind(this);
    this.collectText = this.collectText.bind(this);
    this.tasksToCollect = this.tasksToCollect.bind(this);
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
    this.props.sendRunQueue();
    this.props.hide();
  }

  onCancelClick() {
    this.props.hide();
  }

  onResize() {
    this.resizeTable();
  }

  onHide() { }

  autoLoopCentringOnClick() {
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
    const tasks = [].concat.apply([],
      Object.values(this.props.queue.queue).map((sampleID) => (
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
    const numSamples = this.props.queue.queue.length;
    const numTasks = this.tasksToCollect().length;

    return { numSamples, numTasks };
  }

  collectText() {
    const summary = this.collectionSummary();
    let text = `Collecting ${summary.numTasks} tasks on ${summary.numSamples} samples`;

    if (summary.numTasks === 0) {
      text = `Collecting ${summary.numSamples} samples`;
    }

    return text;
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
    let table = (<div />);

    if (summary.numTasks > 0) {
      table = (
        <div className="scroll">
        <Table striped bordered condensed hover>
          <thead id="table-head">
            <tr>
              <th>Type</th>
              <th>Sample</th>
              <th>Path</th>
              <th>Prefix</th>
              <th># Images</th>
            </tr>
          </thead>
          <tbody id="table-body">
            {tasks.map((task) => (
              <OverlayTrigger
                key={task.sampleID}
                bsClass="collect-confirm-dialog-overlay-trigger"
                placement="bottom"
                overlay={(
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
        </div>
      );
    }

    return table;
  }

  render() {
    return (
      <Modal
        dialogClassName="collect-confirm-dialog"
        show={this.props.show}
        onHide={this.onHide}
      >
        <Modal.Header>
          <Modal.Title>
            Collect queue ?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <b>{this.collectText()}</b>
          </p>
          <div style={ { marginLeft: '20px' } }>
            <span>
              <Checkbox onClick={this.autoLoopCentringOnClick}>
                Auto loop centring
              </Checkbox>
            </span>
          </div>
          <br />
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
    setAutoMountSample: bindActionCreators(setAutoMountSample, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ConfirmCollectDialog);
