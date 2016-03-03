import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueueSearch from '../components/SampleQueue/SampleQueueSearch';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import TodoTree from '../components/SampleQueue/TodoTree';
import HistoryTree from '../components/SampleQueue/HistoryTree';
import SampleQueueButtons from '../components/SampleQueue/SampleQueueButtons';
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import { showForm } from '../actions/methodForm'


class SampleQueueContainer extends React.Component {

// 0 = Started(Blue), 1 = Finished(Green), 2 = Failed(Red), 3 = Warning (Orange)
// Mount will kick down

   componentDidMount() {
    const {doAddMethodResult} = this.props.sampleActions;
    const { socket} = this.props;
    const {getState} = this.props.queueActions;

    //Populate queue with previous state
    getState();

    // Start listening to socketIO to get results of method/sample execution
    socket.on('hwr_record', (record) => {
          if(record.sample !==0 && record.queueId !== 0){
            doAddMethodResult(record.sample, record.queueId, record.state)
          }
    });
  }

    
  render() {

    const { checked, lookup, todo, history, showForm, current, sampleInformation, queue, searchString} = this.props;
    const {sendToggleCheckBox, sendDeleteSample, sendRunSample,sendMountSample, selectSample, sendPauseQueue, sendRunQueue, sendStopQueue} = this.props.queueActions;
    const {sendDeleteSampleMethod, sendAddSampleMethod} = this.props.sampleActions;

    return (


      <div className="row">
            <div className="col-xs-12 queue">
                <SampleQueueSearch />
                <CurrentTree showForm={showForm} currentNode={current} sampleInformation={sampleInformation} queue={queue} lookup={lookup} toggleCheckBox={sendToggleCheckBox} checked={checked} select={selectSample} deleteSample={sendDeleteSample} deleteMethod={sendDeleteSampleMethod} run={sendRunSample} />
                <TodoTree showForm={showForm} todoList={todo} sampleInformation={sampleInformation} queue={queue} lookup={lookup} toggleCheckBox={sendToggleCheckBox} checked={checked} select={selectSample} deleteSample={sendDeleteSample} deleteMethod={sendDeleteSampleMethod} mount={sendMountSample} searchString={searchString}/>
                <HistoryTree showForm={showForm} historyList={history} sampleInformation={sampleInformation} queue={queue} lookup={lookup} select={selectSample} searchString={searchString}/>
            </div>
            <div className="col-xs-12">
                <SampleQueueButtons showForm={showForm} addMethod={sendAddSampleMethod} checked={checked} lookup={lookup} pauseQueue={sendPauseQueue}  stopQueue={sendStopQueue} runQueue={sendRunQueue}/>
            </div>
      </div>
    )
  }
}


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
          select_all: state.queue.selectAll
    }
}

function mapDispatchToProps(dispatch) {
 return {
    queueActions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch),
    showForm : bindActionCreators(showForm, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleQueueContainer)