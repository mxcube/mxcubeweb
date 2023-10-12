import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import TodoTree from '../components/SampleQueue/TodoTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import * as beamlineActions from '../actions/beamline'; // eslint-disable-line import/no-namespace
import * as queueActions from '../actions/queue'; // eslint-disable-line import/no-namespace
import * as queueGUIActions from '../actions/queueGUI'; // eslint-disable-line import/no-namespace
import * as sampleViewActions from '../actions/sampleview'; // eslint-disable-line import/no-namespace
import * as sampleChangerActions from '../actions/sampleChanger'; // eslint-disable-line import/no-namespace
import { showTaskForm } from '../actions/taskForm';
import { Nav } from 'react-bootstrap';
import { showDialog } from '../actions/general';

import UserMessage from '../components/Notify/UserMessage';
import loader from '../img/loader.gif';

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
    queueActions: bindActionCreators(queueActions, dispatch),
    queueGUIActions: bindActionCreators(queueGUIActions, dispatch),
    sampleViewActions: bindActionCreators(sampleViewActions, dispatch),
    sampleChangerActions: bindActionCreators(sampleChangerActions, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch),
    beamlineActions: bindActionCreators(beamlineActions, dispatch),
  };
}

class SampleQueueContainer extends React.Component {
  constructor(props) {
    super(props);
    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(selectedKey) {
    this.props.queueGUIActions.showList(selectedKey);
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
    const {
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
    } = this.props.queueActions;
    const { collapseItem, showConfirmCollectDialog, selectItem, showList } =
      this.props.queueGUIActions;
    const { sendPrepareForNewSample } = this.props.beamlineActions;
    const { loadSample, unloadSample } = this.props.sampleChangerActions;

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
          setEnabledSample={setEnabledSample}
          todoLength={todo.length}
          queueStatus={queueStatus}
          runQueue={showConfirmCollectDialog}
          stopQueue={sendStopQueue}
          pause={sendPauseQueue}
          unpause={sendUnpauseQueue}
          setAutoMountSample={setAutoMountSample}
          autoMountNext={autoMountNext}
          setAutoAddDiffPlan={setAutoAddDiffPlan}
          autoAddDiffPlan={autoAddDiffPlan}
          mounted={current.sampleID}
          runSample={sendRunSample}
          sendSetCentringMethod={sendSetCentringMethod}
          centringMethod={centringMethod}
          todoList={todo}
          sampleList={sampleList}
          sendUnmountSample={unloadSample}
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
            changeOrder={changeTaskOrderAction}
            show={visibleList === 'current'}
            mounted={current.sampleID}
            queue={queue}
            sampleList={sampleList}
            toggleCheckBox={sendToggleCheckBox}
            checked={checked}
            deleteTask={deleteTask}
            pause={sendPauseQueue}
            unpause={sendUnpauseQueue}
            stop={sendStopQueue}
            showForm={showForm}
            unmount={unloadSample}
            queueStatus={queueStatus}
            rootPath={rootPath}
            collapseItem={collapseItem}
            selectItem={selectItem}
            displayData={displayData}
            runSample={sendRunSample}
            todoList={todo}
            moveTask={moveTask}
            addTask={addTask}
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
            collapseItem={collapseItem}
            displayData={displayData}
            mount={loadSample}
            showForm={showForm}
            queueStatus={queueStatus}
            showList={showList}
            sendPrepareForNewSample={sendPrepareForNewSample}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleQueueContainer);
