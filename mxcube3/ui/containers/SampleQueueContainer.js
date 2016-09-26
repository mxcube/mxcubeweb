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

function mapStateToProps(state) {
  return {
    searchString: state.queue.searchString,
    current: state.queue.current,
    todo: state.queue.todo,
    queueStatus: state.queue.queueStatus,
    history: state.queue.history,
    queue: state.queue.queue,
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
      manualMount
    } = this.props;
    const {
      sendToggleCheckBox,
      sendRunSample,
      sendRunQueue,
      sendPauseQueue,
      sendUnpauseQueue,
      sendStopQueue,
      sendUnmountSample,
      changeTaskOrder,
      collapseList,
      collapseTask,
      collapseSample,
      deleteTask,
      setCurrentSample
    } = this.props.queueActions;

    return (
      <div>
                <QueueControl
                  historyLength={history.nodes.length}
                  todoLength={todo.nodes.length}
                  currentNode={current.node}
                  queueStatus={queueStatus}
                  runQueue={sendRunQueue}
                  stopQueue={sendStopQueue}
                />
              <div className="queue-body">
                <CurrentTree
                  changeOrder={changeTaskOrder}
                  show={current.collapsed}
                  collapse={collapseList}
                  mounted={current.node}
                  sampleInformation={sampleInformation}
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
                  mount={setCurrentSample}
                  todoList={todo.nodes}
                />
                <TodoTree
                  show={todo.collapsed}
                  collapse={collapseList}
                  list={todo.nodes}
                  sampleInformation={queue}
                  queue={queue}
                  collapseSample={collapseSample}
                  displayData={displayData}
                  mount={setCurrentSample}
                />
            </div>
      </div>
    );
  }
}
