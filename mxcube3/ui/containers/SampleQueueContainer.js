import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueueSearch from '../components/SampleQueue/SampleQueueSearch';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import TodoTree from '../components/SampleQueue/TodoTree';
import SampleQueueButtons from '../components/SampleQueue/SampleQueueButtons';
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import { showForm } from '../actions/methodForm'


class SampleQueueContainer extends Component {

    
  render() {

    const {selected, checked, lookup, todo, history_tree, showForm, current_tree, current, sampleInformation, queue} = this.props;
    const {toggleCheckBox, sendChangeOrder, sendDeleteSample, finishSample, runSample, selectSample} = this.props.queueActions;
    const {sendDeleteSampleMethod, sendAddSampleMethod} = this.props.sampleActions;

    return (


      <div className="row">
            <div className="col-xs-12 queue">
                <SampleQueueSearch />
                <CurrentTree />
                <TodoTree showForm={showForm} todoList={todo} sampleInformation={sampleInformation} queue={queue} lookup={lookup} toggleCheckBox={toggleCheckBox} checked={checked} select={selectSample} deleteSample={sendDeleteSample} deleteMethod={sendDeleteSampleMethod} run={runSample}/>
                <SampleQueueButtons showForm={showForm} addMethod={sendAddSampleMethod} selected={selected} checked={checked} lookup={lookup}/>
            </div>
      </div>
    )
  }
}


function mapStateToProps(state) {

  let current = false;
  if (state.queue.current){
    current = state.samples_grid.samples_list[state.queue.lookup[state.queue.current]];
    current.queue_id = state.queue.current;
  }
  return { 
          current : current,
          todo: state.queue.todo,
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