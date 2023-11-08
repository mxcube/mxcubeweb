import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import TodoTree from '../components/SampleQueue/TodoTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import {
  sendToggleCheckBox,
  sendPauseQueue,
  sendUnpauseQueue,
  sendStopQueue,
  changeTaskOrderAction,
  deleteTask,
  addTask,
  moveTask,
  setAutoMountSample,
  setAutoAddDiffPlan,
  sendRunSample,
  sendSetCentringMethod,
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

import UserMessage from '../components/Notify/UserMessage';
import loader from '../img/loader.gif';
import { prepareBeamlineForNewSample } from '../actions/beamline';
import { loadSample, unloadSample } from '../actions/sampleChanger';

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
      current,
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

        if (sample.sampleID !== current.sampleID && sample.checked) {
          todo.push(sample.sampleID);
        }
      }
    }

    let sampleName = '';
    let proteinAcronym = '';

    if (current.sampleID) {
      const sampleData = sampleList[current.sampleID] || {};
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
          runQueue={this.props.showConfirmCollectDialog}
          stopQueue={this.props.sendStopQueue}
          pause={this.props.sendPauseQueue}
          unpause={this.props.sendUnpauseQueue}
          setAutoMountSample={this.props.setAutoMountSample}
          autoMountNext={autoMountNext}
          setAutoAddDiffPlan={this.props.setAutoAddDiffPlan}
          autoAddDiffPlan={autoAddDiffPlan}
          mounted={current.sampleID}
          runSample={this.props.sendRunSample}
          sendSetCentringMethod={this.props.sendSetCentringMethod}
          centringMethod={centringMethod}
          todoList={todo}
          sampleList={sampleList}
          sendUnmountSample={this.props.unloadSample}
        />
        <div className="m-tree queue-body">
          <Nav
            variant="tabs"
            fill
            justify
            defaultActiveKey="current"
            activeKey={visibleList}
            onSelect={this.handleSelect}
          >
            <Nav.Item>
              <Nav.Link eventKey="current">
                <b>
                  {current.sampleID
                    ? `Sample: ${proteinAcronym} ${sampleName}`
                    : 'Current'}
                </b>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="todo">
                <b>Queued Samples ({todo.length})</b>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          {loading ? (
            <div className="center-in-box" style={{ zIndex: '1000' }}>
              <img src={loader} className="img-responsive" alt="" />
            </div>
          ) : null}
          <CurrentTree
            changeOrder={this.props.changeTaskOrderAction}
            show={visibleList === 'current'}
            mounted={current.sampleID}
            queue={queue}
            sampleList={sampleList}
            toggleCheckBox={this.props.sendToggleCheckBox}
            checked={checked}
            deleteTask={this.props.deleteTask}
            pause={this.props.sendPauseQueue}
            unpause={this.props.sendUnpauseQueue}
            stop={this.props.sendStopQueue}
            showForm={showForm}
            unmount={this.props.unloadSample}
            queueStatus={queueStatus}
            rootPath={rootPath}
            collapseItem={this.props.collapseItem}
            selectItem={this.props.selectItem}
            displayData={displayData}
            runSample={this.props.sendRunSample}
            todoList={todo}
            moveTask={this.props.moveTask}
            addTask={this.props.addTask}
            plotsData={this.props.plotsData}
            plotsInfo={this.props.plotsInfo}
            shapes={this.props.shapes}
            showDialog={this.props.showDialog}
          />
          <TodoTree
            show={visibleList === 'todo'}
            list={todo}
            queue={queue}
            sampleList={sampleList}
            collapseItem={this.props.collapseItem}
            displayData={displayData}
            mount={this.props.loadSample}
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
            <UserMessage
              messages={this.props.logRecords}
              target="user_level_log"
            />
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchString: state.queueGUI.searchString,
    current: state.queue.current,
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
    sendToggleCheckBox: bindActionCreators(sendToggleCheckBox, dispatch),
    sendPauseQueue: bindActionCreators(sendPauseQueue, dispatch),
    sendUnpauseQueue: bindActionCreators(sendUnpauseQueue, dispatch),
    sendStopQueue: bindActionCreators(sendStopQueue, dispatch),
    changeTaskOrderAction: bindActionCreators(changeTaskOrderAction, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
    moveTask: bindActionCreators(moveTask, dispatch),
    setAutoMountSample: bindActionCreators(setAutoMountSample, dispatch),
    setAutoAddDiffPlan: bindActionCreators(setAutoAddDiffPlan, dispatch),
    sendRunSample: bindActionCreators(sendRunSample, dispatch),
    sendSetCentringMethod: bindActionCreators(sendSetCentringMethod, dispatch),
    setEnabledSample: bindActionCreators(setEnabledSample, dispatch),

    // Queue GUI actions
    collapseItem: bindActionCreators(collapseItem, dispatch),
    showConfirmCollectDialog: bindActionCreators(
      showConfirmCollectDialog,
      dispatch,
    ),
    selectItem: bindActionCreators(selectItem, dispatch),
    showList: bindActionCreators(showList, dispatch),

    // Sample changer actions
    loadSample: bindActionCreators(loadSample, dispatch),
    unloadSample: bindActionCreators(unloadSample, dispatch),

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
