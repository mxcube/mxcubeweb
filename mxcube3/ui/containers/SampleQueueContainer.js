import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueueSearch from '../components/SampleQueue/SampleQueueSearch'
import CurrentTree from '../components/SampleQueue/CurrentTree'
import TodoTree from '../components/SampleQueue/TodoTree'
import HistoryTree from '../components/SampleQueue/HistoryTree'
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import * as SampleViewActions from '../actions/sampleview'
import * as TaskFormActions from '../actions/taskForm'
import { showTaskParametersForm } from '../actions/taskForm'
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';



function mapStateToProps(state) {

  return { 
          searchString : state.queue.searchString,
          current : state.queue.current,
          todo: state.queue.todo,
          history: state.queue.history,
          queue: state.queue.queue,
          sampleInformation: state.samples_grid.samples_list,
          checked: state.queue.checked,
          lookup: state.queue.lookup,
          select_all: state.queue.selectAll,
          automatic : state.queue.automatic

    }
}

function mapDispatchToProps(dispatch) {
 return {
    queueActions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch),
    sampleViewActions : bindActionCreators(SampleViewActions, dispatch),
    taskFormActions : bindActionCreators(TaskFormActions, dispatch),
    showForm : bindActionCreators(showTaskParametersForm, dispatch)
  }
}


@DragDropContext(HTML5Backend)
@connect(mapStateToProps, mapDispatchToProps)
export default class SampleQueueContainer extends React.Component {

// 0 = Started(Blue), 1 = Finished(Green), 2 = Failed(Red), 3 = Warning (Orange)
// Mount will kick down

   componentDidMount() {
    const {socket} = this.props;
    //const {getState} = this.props.queueActions;

     //Populate queue with previous state
     //getState();

    // Start listening to socketIO to get results of task/sample execution
    socket.on('hwr_record', (record) => {
          // if(record.sample !==0 && record.queueId !== 0){
          //   doAddTaskResult(record.sample, record.queueId, record.state)
          // }
          if(record.signal === "minidiffStateChanged"){
            this.props.sampleViewActions.updatePointsPosition(record.data);
          }
     });
  
   }

   filterList(list){
     let listFiltered = list.filter((queue_id) => {
            let sampleData = this.props.sampleInformation[this.props.lookup[queue_id]];
            return (this.props.searchString === "" || sampleData.id.indexOf(this.props.searchString) > -1 );
        });
        return(listFiltered);
   }

    
  render() {

    const {checked, lookup, todo, history, current, sampleInformation, queue, automatic} = this.props;
    const {sendToggleCheckBox, sendDeleteSample, sendRunSample,sendMountSample, changeOrder, changeTaskOrder, collapseList} = this.props.queueActions;
    const {sendDeleteSampleTask} = this.props.sampleActions;
    const {showTaskParametersForm} = this.props.taskFormActions;

    return (

      <div>
            <div className="queue-head">
                <SampleQueueSearch />
            </div>
            <div className="queue-body">
                <CurrentTree automatic={automatic} changeOrder={changeTaskOrder} show={current.collapsed} collapse={collapseList} mounted={current.node} sampleInformation={sampleInformation} queue={queue} lookup={lookup} toggleCheckBox={sendToggleCheckBox} checked={checked} deleteTask={sendDeleteSampleTask} run={sendRunSample} showForm={showTaskParametersForm} />
                { automatic ?
                  <TodoTree show={todo.collapsed} collapse={collapseList} list={this.filterList(todo.nodes)} sampleInformation={sampleInformation} lookup={lookup} deleteSample={sendDeleteSample} mountSample={sendMountSample} changeOrder={changeOrder} />
                : "" }
                <HistoryTree show={history.collapsed} collapse={collapseList} list={this.filterList(history.nodes)} sampleInformation={sampleInformation} queue={queue} lookup={lookup}/>
            </div>
      </div>
    )
  }
}
