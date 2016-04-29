import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import AddSample from '../components/Tasks/AddSample';
import { sendAddSampleTask, sendChangeSampleTask, sendAddSampleAndTask, doAddSample } from '../actions/samples_grid';
import { hideTaskParametersForm, showTaskForm } from '../actions/taskForm';


class TaskContainer extends React.Component {

  render() {
    const lookup = this.props.lookup_queue_id;
    return (
      <div className="col-xs-12">
            <Characterisation pointId={this.props.pointId} lookup={lookup} sampleIds={this.props.sampleIds} taskData={this.props.taskData} addSampleAndTask={this.props.addSampleAndTask} changeTask={this.props.changeTask} addTask={this.props.addTask} hide={this.props.hideTaskParametersForm} show={this.props.showForm === 'Characterisation'} />
            <DataCollection pointId={this.props.pointId} lookup={lookup} sampleIds={this.props.sampleIds} taskData={this.props.taskData} addSampleAndTask={this.props.addSampleAndTask} changeTask={this.props.changeTask} addTask={this.props.addTask} hide={this.props.hideTaskParametersForm} show={this.props.showForm === 'DataCollection'} />
            <AddSample hide={this.props.hideTaskParametersForm} show={this.props.showForm === 'AddSample'} add={this.props.doAddSample} id={this.props.manualMountID} phase={this.props.currentPhase} />
      </div>);
  }
}


function mapStateToProps(state) {
  return {
    showForm: state.taskForm.showForm,
    lookup_queue_id: state.queue.lookup_queue_id,
    taskData: state.taskForm.taskData,
    sampleIds: state.taskForm.sampleIds,
    pointId: state.taskForm.pointId,
    defaultParameters: state.taskForm.defaultParameters,
    manualMountID: state.samples_grid.manualMount.id,
    currentPhase: state.sampleview.currentPhase
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    hideTaskParametersForm: bindActionCreators(hideTaskParametersForm, dispatch),
    addSampleAndTask: bindActionCreators(sendAddSampleAndTask, dispatch),
    addTask: bindActionCreators(sendAddSampleTask, dispatch),
    changeTask: bindActionCreators(sendChangeSampleTask, dispatch),
    doAddSample: bindActionCreators(doAddSample, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskContainer);

