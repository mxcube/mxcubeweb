import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import TodoTree from '../components/SampleQueue/TodoTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import * as QueueActions from '../actions/queue';
import * as SampleViewActions from '../actions/sampleview';
import { showTaskForm } from '../actions/taskForm';
import { DragDropContext as dragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Nav, NavItem } from 'react-bootstrap';

function mapStateToProps(state) {
  return {
    searchString: state.queue.searchString,
    current: state.queue.current,
    visibleList: state.queue.visibleList,
    todo: state.queue.todo,
    queueStatus: state.queue.queueStatus,
    history: state.queue.history,
    queue: state.queue.queue,
    sampleOrder: state.queue.sampleOrder,
    sampleInformation: state.queue.sampleList,
    checked: state.queue.checked,
    select_all: state.queue.selectAll,
    mounted: state.queue.manualMount.set,
    rootPath: state.queue.rootPath,
    displayData: state.queue.displayData,
    manualMount: state.queue.manualMount
  };
}


function mapDispatchToProps(dispatch) {
  return {
    queueActions: bindActionCreators(QueueActions, dispatch),
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
    this.runQueue = this.runQueue.bind(this);
    this.runSample = this.runSample.bind(this);
  }

  handleSelect(selectedKey) {
    this.props.queueActions.showList(selectedKey);
  }

  runQueue() {
    this.props.queueActions.setQueueAndRun(this.props.queue, this.props.sampleOrder);
  }

  runSample(sampleID) {
    const queue = { sampleID: this.props.queue[sampleID] };
    this.props.queueActions.setQueueAndRun(queue, this.props.sampleOrder);
  }

  render() {
    const {
      checked,
      todo,
      current,
      history,
      sampleInformation,
      queue,
      showForm,
      queueStatus,
      rootPath,
      displayData,
      manualMount,
      visibleList
    } = this.props;
    const {
      sendToggleCheckBox,
      sendPauseQueue,
      sendUnpauseQueue,
      sendStopQueue,
      sendUnmountSample,
      changeTaskOrder,
      collapseTask,
      collapseSample,
      deleteTask,
      setCurrentSample
    } = this.props.queueActions;

    return (
      <div style={ { display: 'flex', flexDirection: 'column', width: '100%' } }>
                <QueueControl
                  historyLength={history.nodes.length}
                  todoLength={todo.nodes.length}
                  currentNode={current.node}
                  queueStatus={queueStatus}
                  runQueue={this.runQueue}
                  stopQueue={sendStopQueue}
                />
              <div className="queue-body">
                <div className="m-tree">
                  <Nav
                    bsStyle="tabs"
                    justified
                    activeKey={visibleList}
                    onSelect={this.handleSelect}
                  >
                    <NavItem eventKey={'current'}>Current</NavItem>
                    <NavItem eventKey={'todo'}>Upcoming</NavItem>
                  </Nav>
                  <CurrentTree
                    changeOrder={changeTaskOrder}
                    show={visibleList === 'current'}
                    mounted={current.node}
                    sampleInformation={sampleInformation}
                    queue={queue}
                    toggleCheckBox={sendToggleCheckBox}
                    checked={checked}
                    deleteTask={deleteTask}
                    run={this.runSample}
                    pause={sendPauseQueue}
                    unpause={sendUnpauseQueue}
                    stop={sendStopQueue}
                    showForm={showForm}
                    unmount={sendUnmountSample}
                    queueStatus={queueStatus}
                    rootPath={rootPath}
                    collapseTask={collapseTask}
                    displayData={displayData}
                    manualMount={manualMount}
                    mount={setCurrentSample}
                    todoList={todo.nodes}
                  />
                  <TodoTree
                    show={visibleList === 'todo'}
                    list={todo.nodes}
                    sampleInformation={queue}
                    queue={queue}
                    collapseSample={collapseSample}
                    displayData={displayData}
                    mount={setCurrentSample}
                  />
                </div>
            </div>
      </div>
    );
  }
}
