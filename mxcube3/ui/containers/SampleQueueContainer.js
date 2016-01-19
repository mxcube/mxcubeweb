import React, { Component, PropTypes } from 'react'
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


class SampleQueueContainer extends Component {

    
  render() {

    const {selected, checked, lookup, todo, history, showForm, current, sampleInformation, queue, searchString} = this.props;
    const {sendToggleCheckBox, sendChangeOrder, sendDeleteSample, finishSample, sendRunSample,sendMountSample, selectSample} = this.props.queueActions;
    const {sendDeleteSampleMethod, sendAddSampleMethod} = this.props.sampleActions;

    return (


      <div className="row">
            <div className="col-xs-12 queue">
                <SampleQueueSearch />
                <i className="fa fa-check-circle-o" onClick={() => finishSample(this.props.current)}> Press the icon to finish sample</i>
                <CurrentTree showForm={showForm} currentNode={current} sampleInformation={sampleInformation} queue={queue} lookup={lookup} toggleCheckBox={sendToggleCheckBox} checked={checked} select={selectSample} deleteSample={sendDeleteSample} deleteMethod={sendDeleteSampleMethod} run={sendRunSample} />
                <TodoTree showForm={showForm} todoList={todo} sampleInformation={sampleInformation} queue={queue} lookup={lookup} toggleCheckBox={sendToggleCheckBox} checked={checked} select={selectSample} deleteSample={sendDeleteSample} deleteMethod={sendDeleteSampleMethod} mount={sendMountSample} searchString={searchString}/>
                <HistoryTree showForm={showForm} historyList={history} sampleInformation={sampleInformation} queue={queue} lookup={lookup} select={selectSample} searchString={searchString}/>
                <SampleQueueButtons showForm={showForm} addMethod={sendAddSampleMethod} selected={selected} checked={checked} lookup={lookup}/>
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
          selected: state.queue.selected,
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