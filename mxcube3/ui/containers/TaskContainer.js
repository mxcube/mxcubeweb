import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Characterisation from '../components/Tasks/Characterisation'
import DataCollection from '../components/Tasks/DataCollection'
import { sendAddSampleTask, sendChangeSampleTask, sendAddSampleAndTask, showTaskParametersForm } from '../actions/samples_grid'
import { hideTaskParametersForm } from '../actions/taskForm'
import SampleTaskButtons from '../components/Tasks/TaskButtons' 


class TaskContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const clicked_task = this.props.clicked_task;
    const selected = this.props.selected;
    const lookup = this.props.lookup_queue_id;

    return (
      <div className="col-xs-12">
            <SampleTaskButtons showForm={this.props.showTaskParametersForm}/>
            <Characterisation addSampleAndTask={this.props.addSampleAndTask} show={this.props.showForm} clicked_task={clicked_task} changeTask={this.props.changeTask} addTask={this.props.addTask} hide={this.props.hideTaskParametersForm} lookup={lookup} samples_list={this.props.samples_list} selected={selected} show={this.props.showForm === 'Characterisation'}/>
            <DataCollection addSampleAndTask={this.props.addSampleAndTask} show={this.props.showForm} clicked_task={clicked_task} changeTask={this.props.changeTask} addTask={this.props.addTask} hide={this.props.hideTaskParametersForm} lookup={lookup} sampleList={this.props.samples_list} selected={selected} show={this.props.showForm === 'DataCollection'}/>
      </div>);
  }
}


function mapStateToProps(state) {
  return { 
        showForm: state.taskForm.showForm,
        selected: state.samples_grid.selected,
        lookup_queue_id: state.queue.lookup_queue_id,
        samples_list : state.samples_grid.samples_list,
        clicked_task : state.samples_grid.clicked_task
  }
}

function mapDispatchToProps(dispatch) {
  return {
      showTaskParametersForm: (task) => dispatch(showTaskParametersForm(task)),
      hideTaskParametersForm: () => dispatch(hideTaskParametersForm()),
      addSampleAndTask: (id, parameters) => dispatch(sendAddSampleAndTask(id, parameters)),
      addTask: bindActionCreators(sendAddSampleTask, dispatch),
      changeTask: bindActionCreators(sendChangeSampleTask, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskContainer)

