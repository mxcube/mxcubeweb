import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Characterisation from '../components/Tasks/Characterisation'
import DataCollection from '../components/Tasks/DataCollection'
import { sendAddSampleTask, sendChangeSampleTask, sendAddSampleAndTask } from '../actions/samples_grid'
import { hideTaskParametersForm, showTaskParametersForm } from '../actions/taskForm'
import SampleTaskButtons from '../components/Tasks/TaskButtons' 


class TaskContainer extends React.Component {

  render() {
    const selected = this.props.selected;
    const lookup = this.props.lookup_queue_id;

    return (
      <div className="col-xs-12">
            <SampleTaskButtons defaultParameters={this.props.defaultParameters} showForm={this.props.showTaskParametersForm} selected={selected} />
            <Characterisation lookup={lookup} sampleIds={this.props.sampleIds} taskData={this.props.taskData} addSampleAndTask={this.props.addSampleAndTask} changeTask={this.props.changeTask} addTask={this.props.addTask} hide={this.props.hideTaskParametersForm} show={this.props.showForm === 'Characterisation'}/>
            <DataCollection lookup={lookup} sampleIds={this.props.sampleIds} taskData={this.props.taskData} addSampleAndTask={this.props.addSampleAndTask} changeTask={this.props.changeTask} addTask={this.props.addTask} hide={this.props.hideTaskParametersForm} show={this.props.showForm === 'DataCollection'}/>
      </div>);
  }
}


function mapStateToProps(state) {
  return { 
        showForm : state.taskForm.showForm,
        selected : state.samples_grid.selected,
        lookup_queue_id: state.queue.lookup_queue_id,
        taskData : state.taskForm.taskData,
        sampleIds :  state.taskForm.sampleIds,
        defaultParameters : state.taskForm.defaultParameters
  }
}

function mapDispatchToProps(dispatch) {
  return {
      showTaskParametersForm: bindActionCreators(showTaskParametersForm, dispatch),
      hideTaskParametersForm: bindActionCreators(hideTaskParametersForm, dispatch),
      addSampleAndTask: bindActionCreators(sendAddSampleAndTask, dispatch),
      addTask: bindActionCreators(sendAddSampleTask, dispatch),
      changeTask: bindActionCreators(sendChangeSampleTask, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskContainer)

