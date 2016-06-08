import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import AddSample from '../components/Tasks/AddSample';
import { hideTaskParametersForm, showTaskForm } from '../actions/taskForm';
import { sendCurrentPhase } from '../actions/sampleview';
import {
  sendAddSampleTask,
  sendChangeSampleTask,
  sendAddSampleAndTask,
  doAddSample
} from '../actions/samplesGrid';

class TaskContainer extends React.Component {

  render() {
    const lookup = this.props.lookup_queueID;
    return (
      <div className="col-xs-12">
        <Characterisation
          pointId={this.props.pointId}
          lookup={lookup}
          sampleIds={this.props.sampleIds}
          taskData={this.props.taskData}
          addSampleAndTask={this.props.addSampleAndTask}
          changeTask={this.props.changeTask}
          addTask={this.props.addTask}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'Characterisation'}
          rootPath={this.props.rootPath}
        />

        <DataCollection
          pointId={this.props.pointId}
          lookup={lookup}
          sampleIds={this.props.sampleIds}
          taskData={this.props.taskData}
          addSampleAndTask={this.props.addSampleAndTask}
          changeTask={this.props.changeTask}
          addTask={this.props.addTask}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'DataCollection'}
          rootPath={this.props.rootPath}
        />

        <AddSample
          hide={this.props.hideTaskParametersForm}
          show={this.props.showForm === 'AddSample'}
          add={this.props.doAddSample}
          id={this.props.manualMountID}
          phase={this.props.currentPhase}
          setPhase={this.props.sendCurrentPhase}
        />
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    showForm: state.taskForm.showForm,
    lookup_queueID: state.queue.lookup_queueID,
    taskData: state.taskForm.taskData,
    sampleIds: state.taskForm.sampleIds,
    pointId: state.taskForm.pointId,
    defaultParameters: state.taskForm.defaultParameters,
    manualMountID: state.samples_grid.manualMount.id,
    currentPhase: state.sampleview.currentPhase,
    apertureList: state.sampleview.apertureList,
    rootPath: state.queue.rootPath,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    hideTaskParametersForm: bindActionCreators(hideTaskParametersForm, dispatch),
    addSampleAndTask: bindActionCreators(sendAddSampleAndTask, dispatch),
    addTask: bindActionCreators(sendAddSampleTask, dispatch),
    changeTask: bindActionCreators(sendChangeSampleTask, dispatch),
    doAddSample: bindActionCreators(doAddSample, dispatch),
    sendCurrentPhase: bindActionCreators(sendCurrentPhase, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskContainer);

