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
import { SAMPLE_MOUNTED } from '../constants';

function mapStateToProps(state) {
  return {
    searchString: state.queueGUI.searchString,
    current: state.queue.current,
    visibleList: state.queueGUI.visibleList,
    queueStatus: state.queue.queueStatus,
    queue: state.queue.queue,
    sampleList: state.sampleGrid.sampleList,
    sampleOrder: state.sampleGrid.order,
    checked: state.queue.checked,
    rootPath: state.queue.rootPath,
    displayData: state.queueGUI.displayData,
    loading: state.queueGUI.loading,
    userMessages: state.general.userMessages
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
      deleteTask,
      sendMountSample,
      moveTask
    } = this.props.queueActions;
    const {
      collapseTask,
      collapseSample
    } = this.props.queueGUIActions;

    // go through the queue, check if sample has been collected or not
    // to make todo and history lists
    const todo = [];
    const history = [];

    for (const key of sampleOrder) {
      if (queue.includes(key)) {
        const sample = sampleList[key];

        if (sample.state && SAMPLE_MOUNTED) {
          history.push(sample.sampleID);
        } else if (sample.sampleID !== current.sampleID) {
          todo.push(sample.sampleID);
        }
      }
    }

    return (
      <div style={ { display: 'flex', flexDirection: 'column', width: '100%' } }>
                <QueueControl
                  ref="queueContainer"
                  historyLength={history.length}
                  todoLength={todo.length}
                  currentNode={current.sampleID}
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
                  mounted={current.sampleID}
                  queue={queue}
                  sampleList={sampleList}
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
                  mount={sendMountSample}
                  todoList={todo}
                  moveTask={moveTask}
                />
                <TodoTree
                  show={visibleList === 'todo'}
                  list={todo}
                  queue={queue}
                  sampleList={sampleList}
                  collapseSample={collapseSample}
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
