import React from 'react';
import ReactDOM from 'react-dom';
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
import UserMessage from '../components/Notify/UserMessage';
import loader from '../img/loader.gif';

function mapStateToProps(state) {
  return {
    searchString: state.queue.searchString,
    current: state.queue.current,
    visibleList: state.queue.visibleList,
    todo: state.queue.todo,
    queueStatus: state.queue.queueStatus,
    history: state.queue.history,
    queue: state.queue.queue,
    checked: state.queue.checked,
    select_all: state.queue.selectAll,
    mounted: state.queue.manualMount.set,
    rootPath: state.queue.rootPath,
    displayData: state.queueGUI.displayData,
    manualMount: state.queue.manualMount,
    loading: state.queueGUI.loading,
    userMessages: state.general.userMessages
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
  }

  handleSelect(selectedKey) {
    this.props.queueActions.showList(selectedKey);
  }


  render() {
    const {
      checked,
      todo,
      current,
      history,
      queue,
      showForm,
      queueStatus,
      rootPath,
      displayData,
      manualMount,
      visibleList,
      loading
    } = this.props;
    const {
      sendToggleCheckBox,
      sendRunSample,
      sendRunQueue,
      sendPauseQueue,
      sendUnpauseQueue,
      sendStopQueue,
      sendUnmountSample,
      changeTaskOrderAction,
      collapseTask,
      collapseSample,
      deleteTask,
      sendMountSample,
      moveTask
    } = this.props.queueActions;

    return (
      <div style={ { display: 'flex', flexDirection: 'column', width: '100%' } }>
                <QueueControl
                  ref="queueContainer"
                  historyLength={history.length}
                  todoLength={todo.length}
                  currentNode={current.node}
                  queueStatus={queueStatus}
                  runQueue={sendRunQueue}
                  stopQueue={sendStopQueue}
                />
              <div className="m-tree queue-body">
                <Nav
                  bsStyle="tabs"
                  justified
                  activeKey={visibleList}
                  onSelect={this.handleSelect}
                >
                  <NavItem eventKey={'current'}>Current</NavItem>
                  <NavItem eventKey={'todo'}>Upcoming</NavItem>
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
                  mounted={current.node}
                  queue={queue}
                  toggleCheckBox={sendToggleCheckBox}
                  checked={checked}
                  deleteTask={deleteTask}
                  run={sendRunSample}
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
                  mount={sendMountSample}
                  todoList={todo}
                  moveTask={moveTask}
                />
                <TodoTree
                  show={visibleList === 'todo'}
                  list={todo}
                  queue={queue}
                  collapseSample={collapseSample}
                  displayData={displayData}
                  mount={sendMountSample}
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
