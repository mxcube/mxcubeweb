import React from 'react';
import ReactDOM from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import TodoTree from '../components/SampleQueue/TodoTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import * as QueueActions from '../actions/queue';
import * as QueueGUIActions from '../actions/queueGUI';
import * as SampleViewActions from '../actions/sampleview';
import { showTaskForm } from '../actions/taskForm';
import { DragDropContext as dragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Nav, NavItem } from 'react-bootstrap';
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
    rootPath: state.queue.rootPath,
    displayData: state.queueGUI.displayData,
    loading: state.queueGUI.loading,
    userMessages: state.general.userMessages,
    plotsData: state.beamline.plotsData,
    plotsInfo: state.beamline.plotsInfo,
  };
}


function mapDispatchToProps(dispatch) {
  return {
    queueActions: bindActionCreators(QueueActions, dispatch),
    queueGUIActions: bindActionCreators(QueueGUIActions, dispatch),
    sampleViewActions: bindActionCreators(SampleViewActions, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch)
  };
}


@dragDropContext(HTML5Backend)
@connect(mapStateToProps, mapDispatchToProps)
export default class SampleQueueContainer extends React.Component {

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
      centringMethod
    } = this.props;
    const {
      sendToggleCheckBox,
      sendPauseQueue,
      sendUnpauseQueue,
      sendStopQueue,
      sendUnmountSample,
      changeTaskOrderAction,
      deleteTask,
      addTask,
      sendMountSample,
      moveTask,
      setAutoMountSample,
      setAutoAddDiffPlan,
      sendRunSample,
      sendSetCentringMethod,
      setEnabledSample
    } = this.props.queueActions;
    const {
      collapseItem,
      showConfirmCollectDialog,
      selectItem
    } = this.props.queueGUIActions;

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
      const sampleData = sampleList[current.sampleID];
      sampleName = sampleData.sampleName ? sampleData.sampleName : '';
      proteinAcronym = sampleData.proteinAcronym ? `${sampleData.proteinAcronym} -` : '';
    }

    return (
      <div style={ { display: 'flex', flexDirection: 'column', width: '100%' } }>
        <QueueControl
          ref="queueContainer"
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
          queue={queue}
          sampleList={sampleList}
          sendUnmountSample={sendUnmountSample}
        />
        <div className="m-tree queue-body">
          <Nav
            bsStyle="tabs"
            justified
            activeKey={visibleList}
            onSelect={this.handleSelect}
          >
            <NavItem eventKey={'current'}>
              <b>
                { current.sampleID ? `Sample: ${proteinAcronym} ${sampleName}` : 'Current'}
              </b>
            </NavItem>
            <NavItem eventKey={'todo'}><b>Queued Samples ({todo.length})</b></NavItem>
          </Nav>
          {loading ?
            <div className="center-in-box">
                <img src={loader} className="img-responsive" alt="" />
              </div>
              : null
            }
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
              unmount={sendUnmountSample}
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
            />
            <TodoTree
              show={visibleList === 'todo'}
              list={todo}
              queue={queue}
              sampleList={sampleList}
              collapseItem={collapseItem}
              displayData={displayData}
              mount={sendMountSample}
              showForm={showForm}
              queueStatus={queueStatus}
            />
            <UserMessage
              messages={this.props.userMessages}
              domTarget={() => ReactDOM.findDOMNode(this.refs.queueContainer)}
              placement="left"
              target="queue"
            />
        </div>
      </div>
    );
  }
}
