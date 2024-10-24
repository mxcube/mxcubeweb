import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import TodoTree from '../components/SampleQueue/TodoTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import {
  toggleCheckBox,
  pauseQueue,
  resumeQueue,
  stopQueue,
  changeTaskOrderAction,
  deleteTask,
  addTask,
  moveTask,
  setAutoMountSample,
  setAutoAddDiffPlan,
  runSample,
  setEnabledSample,
} from '../actions/queue';
import {
  collapseItem,
  selectItem,
  showConfirmCollectDialog,
  showList,
} from '../actions/queueGUI';
import { showTaskForm } from '../actions/taskForm';
import { Nav } from 'react-bootstrap';
import { showDialog } from '../actions/general';
import { showWorkflowParametersDialog } from '../actions/workflow';

import UserMessage from '../components/Notify/UserMessage';
import loader from '../img/loader.gif';
import { prepareBeamlineForNewSample } from '../actions/beamline';
import { mountSample, unmountSample } from '../actions/sampleChanger';

class SampleQueueContainer extends React.Component {
  constructor(props) {
    super(props);
    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(selectedKey) {
    this.props.showList(selectedKey);
  }

  render() {
    const {
      checked,
      currentSampleID,
      sampleOrder,
      queue,
      sampleList,
      showForm,
      queueStatus,
      rootPath,
      displayData,
      visibleList,
      loading,
      autoMountNext,
      autoAddDiffPlan,
      centringMethod,
    } = this.props;

    // go through the queue, check if sample has been collected or not
    // to make todo and history lists
    const todo = [];
    const history = [];

    for (const key of sampleOrder) {
      if (queue.includes(key)) {
        const sample = sampleList[key];

        if (sample.sampleID !== currentSampleID && sample.checked) {
          todo.push(sample.sampleID);
        }
      }
    }

    let sampleName = '';
    let proteinAcronym = '';

    if (currentSampleID) {
      const sampleData = sampleList[currentSampleID] || {};
      sampleName = sampleData.sampleName || '';
      proteinAcronym = sampleData.proteinAcronym
        ? `${sampleData.proteinAcronym} -`
        : '';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <QueueControl
          historyLength={history.length}
          queueLength={queue.length}
          queue={queue}
          setEnabledSample={this.props.setEnabledSample}
          todoLength={todo.length}
          queueStatus={queueStatus}
          startQueue={this.props.showConfirmCollectDialog}
          stopQueue={this.props.stopQueue}
          pauseQueue={this.props.pauseQueue}
          resumeQueue={this.props.resumeQueue}
          setAutoMountSample={this.props.setAutoMountSample}
          autoMountNext={autoMountNext}
          setAutoAddDiffPlan={this.props.setAutoAddDiffPlan}
          autoAddDiffPlan={autoAddDiffPlan}
          mounted={currentSampleID}
          runSample={this.props.runSample}
          centringMethod={centringMethod}
          todoList={todo}
          sampleList={sampleList}
          unmountSample={this.props.unmountSample}
        />
        <div className="m-tree queue-body">
          <Nav
            variant="tabs"
            fill
            justify
            defaultActiveKey="current"
            activeKey={visibleList}
            onSelect={this.handleSelect}
            className="queue-nav"
          >
            <Nav.Item>
              <Nav.Link eventKey="current" className="queue-nav-link">
                <b>
                  {currentSampleID
                    ? `Sample: ${proteinAcronym} ${sampleName}`
                    : 'Current'}
                </b>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="todo" className="queue-nav-link">
                <b>Queued Samples ({todo.length})</b>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          {loading ? (
            <div className="center-in-box" style={{ zIndex: '1000' }}>
              <img src={loader} className="img-responsive" width="100" alt="" />
            </div>
          ) : null}
          <CurrentTree
            changeOrder={this.props.changeTaskOrderAction}
            show={visibleList === 'current'}
            mounted={currentSampleID}
            queue={queue}
            sampleList={sampleList}
            toggleCheckBox={this.props.toggleCheckBox}
            checked={checked}
            deleteTask={this.props.deleteTask}
            showForm={showForm}
            unmount={this.props.unmountSample}
            queueStatus={queueStatus}
            rootPath={rootPath}
            collapseItem={this.props.collapseItem}
            selectItem={this.props.selectItem}
            displayData={displayData}
            runSample={this.props.runSample}
            todoList={todo}
            moveTask={this.props.moveTask}
            addTask={this.props.addTask}
            plotsData={this.props.plotsData}
            plotsInfo={this.props.plotsInfo}
            shapes={this.props.shapes}
            showDialog={this.props.showDialog}
            showWorkflowParametersDialog={
              this.props.showWorkflowParametersDialog
            }
          />
          <TodoTree
            show={visibleList === 'todo'}
            list={todo}
            queue={queue}
            sampleList={sampleList}
            collapseItem={this.props.collapseItem}
            displayData={displayData}
            mount={this.props.mountSample}
            showForm={showForm}
            queueStatus={queueStatus}
            showList={this.props.showList}
            prepareBeamlineForNewSample={this.props.prepareBeamlineForNewSample}
          />
          <div className="queue-messages">
            <div className="queue-messages-title">
              <span
                style={{ marginRight: '7px' }}
                className="fas fa-lg fa-info-circle"
              />
              Log messages:
            </div>
            <UserMessage messages={this.props.logRecords} />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchString: state.queueGUI.searchString,
    currentSampleID: state.queue.currentSampleID,
    visibleList: state.queueGUI.visibleList,
    queueStatus: state.queue.queueStatus,
    queue: state.queue.queue,
    autoMountNext: state.queue.autoMountNext,
    autoAddDiffPlan: state.queue.autoAddDiffPlan,
    centringMethod: state.queue.centringMethod,
    sampleList: state.sampleGrid.sampleList,
    sampleOrder: state.sampleGrid.order,
    checked: state.queue.checked,
    rootPath: state.login.rootPath,
    displayData: state.queueGUI.displayData,
    loading: state.queueGUI.loading,
    logRecords: state.logger.logRecords,
    plotsData: state.beamline.plotsData,
    plotsInfo: state.beamline.plotsInfo,
    selectedShapes: state.sampleview.selectedShapes,
    shapes: state.shapes,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    // Queue actions
    toggleCheckBox: bindActionCreators(toggleCheckBox, dispatch),
    pauseQueue: bindActionCreators(pauseQueue, dispatch),
    resumeQueue: bindActionCreators(resumeQueue, dispatch),
    stopQueue: bindActionCreators(stopQueue, dispatch),
    changeTaskOrderAction: bindActionCreators(changeTaskOrderAction, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
    moveTask: bindActionCreators(moveTask, dispatch),
    setAutoMountSample: bindActionCreators(setAutoMountSample, dispatch),
    setAutoAddDiffPlan: bindActionCreators(setAutoAddDiffPlan, dispatch),
    runSample: bindActionCreators(runSample, dispatch),
    setEnabledSample: bindActionCreators(setEnabledSample, dispatch),

    // Workflow action
    showWorkflowParametersDialog: bindActionCreators(
      showWorkflowParametersDialog,
      dispatch,
    ),

    // Queue GUI actions
    collapseItem: bindActionCreators(collapseItem, dispatch),
    showConfirmCollectDialog: bindActionCreators(
      showConfirmCollectDialog,
      dispatch,
    ),
    selectItem: bindActionCreators(selectItem, dispatch),
    showList: bindActionCreators(showList, dispatch),

    // Sample changer actions
    mountSample: bindActionCreators(mountSample, dispatch),
    unmountSample: bindActionCreators(unmountSample, dispatch),

    showForm: bindActionCreators(showTaskForm, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch),
    prepareBeamlineForNewSample: bindActionCreators(
      prepareBeamlineForNewSample,
      dispatch,
    ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleQueueContainer);
